/**
 * Copyright 2024 Scaleton Labs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AssertionResult,
  createEmptyTestResult,
  TestResult,
} from '@jest/test-result';
import type { RunTest } from 'create-jest-runner';
import { runTolkCompiler } from '@ton/tolk-js';
import * as fs from 'node:fs';
import { defaultConfig, Executor } from '@ton/sandbox';
import {
  Address,
  beginCell,
  Cell,
  getMethodId,
  toNano,
  TupleItem,
} from '@ton/core';
import { randomBytes } from 'node:crypto';
import { formatResultsErrors } from 'jest-message-util';
import { BOLD_WEIGHT, DIM_COLOR } from 'jest-matcher-utils';
import chalk from 'chalk';
import * as assert from 'node:assert';
import { extractAnnotationsFromDocBlock, TestAnnotations } from './annotations';
import { extractGetMethods } from './source-code';
import { ASSERTIONS } from './assertions';
import { DebugReader } from './utils/debug-reader';
import { generateIntValues } from './fuzz/int-strategy';
import { generateBoolValues } from './fuzz/bool-strategy';
import { generateAddressValues } from './fuzz/address-strategy';

class SkipRun extends Error {}

function shuffleArray(array: Array<any>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function extractStackTrace(vmLogs: string) {
  return vmLogs
    .split(/\n/)
    .filter((line) => {
      if (line.startsWith('gas remaining:')) return false;
      if (line.startsWith('stack:')) return false;
      if (line.startsWith('code cell hash:')) return false;
      return true;
    })
    .map((line) => {
      let matches;

      if ((matches = line.match(/^execute ([^ $]+)(.*)/))) {
        return chalk.cyan(matches[1]) + chalk.dim(matches[2]);
      }

      if ((matches = line.match(/^(handling exception code \d+:\s*)(.*)/))) {
        return matches[1] + chalk.bold(matches[2]);
      }

      return line;
    })
    .slice(-8)
    .join('\n');
}

const runTest: RunTest = async ({
  testPath,
  config,
  globalConfig,
}): Promise<TestResult> => {
  for (const setupFile of config.setupFiles) {
    try {
      require(setupFile);
    } catch (error: unknown) {
      throw new Error(`Setup file "${setupFile}" failed: ${error}`);
    }
  }

  const entrypointFileName = testPath.replace(config.rootDir + '/', '');

  const result = await runTolkCompiler({
    entrypointFileName,
    fsReadCallback: (path: string) => {
      const content = fs.readFileSync(path).toString();

      // NOTE: It's required to have either onInternalMessage() or main() method.
      if (path == entrypointFileName) {
        const disableMain = !!content.match(/(^|\n)\s*\/\/\s+@no-main/);
        if (!disableMain) {
          return content + '\n\n' + 'fun main() {}';
        }
      }

      return content;
    },
    withStackComments: true,
  });

  if (result.status !== 'ok') {
    throw result.message;
  }

  const testSourceCode = result.sourcesSnapshot.find(
    ({ filename }) => filename === entrypointFileName,
  );

  if (!testSourceCode) {
    throw new Error(
      `Expected behaviour: ${entrypointFileName} not found in a snapshot.`,
    );
  }

  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  const testResults: AssertionResult[] = [];
  const testCases = await extractGetMethods(testSourceCode.contents);

  // common setup
  const executor = await Executor.create();
  const code = Cell.fromBase64(result.codeBoc64);
  const data = beginCell().endCell();

  const DEFAULT_RUNS = 100;
  const DEFAULT_ADDRESS = new Address(0, randomBytes(32));
  const DEFAULT_RANDOM_SEED = randomBytes(32);
  const DEFAULT_BALANCE = toNano('1');
  const DEFAULT_GAS_LIMIT = 2n ** 62n;
  const DEFAULT_UNIX_TIME = Math.floor(Date.now() / 1000);

  const testNamePattern =
    globalConfig.testNamePattern &&
    new RegExp(globalConfig.testNamePattern, 'i');

  for (const testCase of testCases) {
    let annotations: TestAnnotations = {};
    let duration = 0;

    const testCaseName = testCase.methodName
      .replace(/^(test|testFuzz)_/, '')
      .replace(/_/g, ' ');

    try {
      annotations = testCase.docBlock
        ? extractAnnotationsFromDocBlock(testCase.docBlock)
        : {};

      const isTest = testCase.methodName.match(/^test_/);

      const isFuzzTest = testCase.methodName.match(/^testFuzz_/);

      if (!isTest && !isFuzzTest) {
        continue;
      }

      const skip =
        annotations.skip ||
        (testNamePattern && !testNamePattern.test(testCase.methodName));

      if (skip) {
        testResults.push({
          duration: 0,
          failureDetails: [],
          failureMessages: [],
          numPassingAsserts: 0,
          status: 'pending',
          ancestorTitles: annotations.scope ? [annotations.scope] : [],
          title: testCaseName,
          fullName: testCaseName,
        });

        numPendingTests += 1;
        continue;
      }

      if (annotations.todo) {
        testResults.push({
          duration: 0,
          failureDetails: [],
          failureMessages: [],
          numPassingAsserts: 0,
          status: 'todo',
          ancestorTitles: annotations.scope ? [annotations.scope] : [],
          title: testCaseName,
          fullName: testCaseName,
        });

        numTodoTests += 1;
        continue;
      }

      if (testCase.parameters.length && !isFuzzTest) {
        throw Error('Only fuzz tests can have arguments.');
      }

      const runTest = async (stack: TupleItem[] = []) => {
        const start = Date.now();
        const { output, debugLogs } = await executor.runGetMethod({
          code,
          data,
          methodId: testCase.methodId ?? getMethodId(testCase.methodName),
          unixTime: DEFAULT_UNIX_TIME,
          balance: DEFAULT_BALANCE,
          stack,
          address: DEFAULT_ADDRESS,
          randomSeed: DEFAULT_RANDOM_SEED,
          verbosity: 'full_location_gas',
          config: defaultConfig,
          gasLimit: BigInt(annotations.gasLimit ?? DEFAULT_GAS_LIMIT),
          debugEnabled: true,
        });
        const end = Date.now();

        duration += end - start;

        let expectedExitCode = 0;

        const debugReader = DebugReader.fromLogs(debugLogs);

        const handlers: {
          [instruction: string]: (debugReader: DebugReader) => void;
        } = {
          TEST_EXIT_CODE: () => {
            expectedExitCode = debugReader.nextInt();
          },
          TEST_ASSUME: () => {
            throw new SkipRun();
          },
          ...ASSERTIONS,
        };

        while (!debugReader.isEOF()) {
          const entry = debugReader.next();
          if (handlers[entry]) {
            handlers[entry](debugReader);
          } else {
            console.log('unknown value:', entry);
          }
        }

        if (!output.success) {
          throw `Execution failed: ${output.error}`;
        }

        if (expectedExitCode !== 0) {
          assert.equal(
            output.vm_exit_code,
            expectedExitCode,
            `Test case has thrown an error code ${output.vm_exit_code} (expected ${expectedExitCode}).`,
          );
        } else {
          if (output.vm_exit_code !== 0) {
            const stackTrace = extractStackTrace(output.vm_log);
            throw new Error(
              `Test case has failed with an error code ${output.vm_exit_code}.\n\n[...]\n${stackTrace}`,
            );
          }
        }
      };

      if (isFuzzTest) {
        const runs = annotations.runs ?? DEFAULT_RUNS;

        const parameters: TupleItem[][] = [];

        for (const parameter of testCase.parameters) {
          let matches;

          // int
          if ((matches = parameter.type.match(/^(u?)int(\d*)$/))) {
            const signed = matches[1] !== 'u';
            const bits = parseInt(matches[2] ?? 256);

            parameters.push(generateIntValues(bits, signed, runs));
            continue;
          }

          if (parameter.type === 'bool') {
            parameters.push(generateBoolValues(runs));
            continue;
          }

          if (parameter.type === 'address') {
            parameters.push(generateAddressValues(runs));
            continue;
          }

          throw new Error(`Fuzz tests do not support type ${parameter.type}.`);
        }

        parameters.forEach((stack) => shuffleArray(stack));

        let passed = 0;
        let failed = 0;
        let skipped = 0;

        let failures: string[] = [];

        for (let runIndex = 0; runIndex < runs; runIndex++) {
          try {
            await runTest(
              testCase.parameters.map(
                (_, index) => parameters[index][runIndex],
              ),
            );
            passed++;
          } catch (error) {
            if (error instanceof SkipRun) {
              skipped++;
              continue;
            }

            failed++;

            const message =
              error instanceof Error
                ? error.message
                : 'Unknown error occurred.';

            const formatParameter = (type: string, item: TupleItem) => {
              if (item.type === 'slice') {
                return type === 'address'
                  ? (item.cell.asSlice().loadAddressAny()?.toString() ?? null)
                  : item.cell.toString();
              }

              if (item.type === 'int') {
                return type === 'bool' ? !!item.value : item.value;
              }

              return DIM_COLOR('unknown');
            };

            failures.push(
              `${BOLD_WEIGHT(`Run #${runIndex}`)}: ${message.substring(0, message.indexOf('\n'))}\n` +
                testCase.parameters
                  .map(
                    (parameter, parameterIndex) =>
                      `${parameterIndex === testCase.parameters.length - 1 ? '└' : '├'} ${BOLD_WEIGHT(parameter.name)} = ${formatParameter(parameter.type, parameters[parameterIndex][runIndex])}`,
                  )
                  .join('\n'),
            );
          }
        }

        if (failures.length) {
          throw new Error(
            `Fuzz test failed (${passed} passed, ${failed} failed, ${skipped} skipped).\n\n${failures.join('\n\n')}`,
          );
        }
      } else {
        await runTest();
      }

      testResults.push({
        duration,
        failureDetails: [],
        failureMessages: [],
        numPassingAsserts: 1,
        status: 'passed',
        ancestorTitles: annotations.scope ? [annotations.scope] : [],
        title: testCaseName,
        fullName: testCaseName,
      });

      numPassingTests += 1;
    } catch (error: unknown) {
      const failureMessage =
        typeof error === 'string'
          ? error
          : error instanceof Error
            ? error.message
            : `${error}`;

      testResults.push({
        duration,
        failureDetails: [],
        failureMessages: [failureMessage],
        numPassingAsserts: 0,
        status: 'failed',
        ancestorTitles: annotations.scope ? [annotations.scope] : [],
        title: testCaseName,
        fullName: testCaseName,
      });

      numFailingTests += 1;
    }
  }
  return {
    ...createEmptyTestResult(),
    failureMessage: formatResultsErrors(
      testResults,
      config,
      globalConfig,
      testPath,
    ),
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    testResults,
    testFilePath: testPath,
  };
};
export = runTest;
