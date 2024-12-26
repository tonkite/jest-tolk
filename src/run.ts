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
import { Address, beginCell, Cell, getMethodId, toNano } from '@ton/core';
import { randomBytes } from 'node:crypto';
import { formatResultsErrors } from 'jest-message-util';
import chalk from 'chalk';
import * as assert from 'node:assert';
import { extractAnnotationsFromDocBlock, TestAnnotations } from './annotations';
import { extractGetMethods } from './source-code';

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
  const entrypointFileName = testPath.replace(config.rootDir + '/', '');

  const result = await runTolkCompiler({
    entrypointFileName,
    fsReadCallback: (path: string) => {
      const content = fs.readFileSync(path).toString();
      // NOTE: It's required to have either onInternalMessage() or main() method.
      return path == entrypointFileName
        ? content + '\n\n' + 'fun onInternalMessage() {}'
        : content;
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

  const DEFAULT_ADDRESS = new Address(0, randomBytes(32));
  const DEFAULT_RANDOM_SEED = randomBytes(32);
  const DEFAULT_BALANCE = toNano('1');
  const DEFAULT_GAS_LIMIT = 10_000;
  const DEFAULT_UNIX_TIME = Math.floor(Date.now() / 1000);

  const testNamePattern =
    globalConfig.testNamePattern &&
    new RegExp(globalConfig.testNamePattern, 'i');

  for (const testCase of testCases) {
    let annotations: TestAnnotations = {};
    let start: number = 0;
    let end: number = 0;

    const testCaseName = testCase.methodName
      .replace(/^test_/, '')
      .replace(/_/g, ' ');

    try {
      annotations = testCase.docBlock
        ? extractAnnotationsFromDocBlock(testCase.docBlock)
        : {};

      const isTest =
        testCase.methodName.startsWith('test_') || annotations.test;
      if (!isTest) {
        continue;
      }

      const skip =
        annotations.skip ||
        (testNamePattern && !testNamePattern.test(testCase.methodName));
      if (skip) {
        testResults.push({
          duration: end - start,
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
          duration: end - start,
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

      start = Date.now();
      const { output } = await executor.runGetMethod({
        code,
        data,
        methodId: testCase.methodId ?? getMethodId(testCase.methodName),
        unixTime: annotations.unixTime ?? DEFAULT_UNIX_TIME,
        balance: annotations.balance ?? DEFAULT_BALANCE,
        stack: [],
        address: DEFAULT_ADDRESS,
        randomSeed: DEFAULT_RANDOM_SEED,
        verbosity: 'full_location_stack_verbose',
        config: defaultConfig,
        gasLimit: BigInt(annotations.gasLimit ?? DEFAULT_GAS_LIMIT),
        debugEnabled: false,
      });

      end = Date.now();

      if (!output.success) {
        throw `Execution failed: ${output.error}`;
      }

      if (annotations.exitCode) {
        assert.equal(
          output.vm_exit_code,
          annotations.exitCode,
          `Test case has thrown an error code ${output.vm_exit_code} (expected ${annotations.exitCode}).`,
        );
      } else {
        if (output.vm_exit_code !== 0) {
          const stackTrace = extractStackTrace(output.vm_log);
          throw new Error(
            `Test case has failed with an error code ${output.vm_exit_code}.\n\n[...]\n${stackTrace}`,
          );
        }
      }

      testResults.push({
        duration: end - start,
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
        duration: end - start,
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
