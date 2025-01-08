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
import { runTolkCompiler, TolkResultSuccess } from '@ton/tolk-js';
import * as fs from 'node:fs';
import { Executor } from '@ton/sandbox';
import { beginCell, Cell, getMethodId, TupleItem } from '@ton/core';
import { formatResultsErrors } from 'jest-message-util';
import chalk from 'chalk';
import * as assert from 'node:assert';
import { extractAnnotationsFromDocBlock, TestAnnotations } from './annotations';
import {
  ArgType,
  extractGetMethods,
  GetMethodDeclaration,
} from './source-code';
import { executeFuzzTest } from './fuzz';
import { runGetMethodWithDefaults } from './utils';
import { extractFixtures, Fixtures } from './fixture';
import {
  GetMethodResultError,
  GetMethodResultSuccess,
  GetMethodResult,
} from '@ton/sandbox/dist/executor/Executor';

const runTest: RunTest = async ({
  testPath,
  config,
  globalConfig,
}): Promise<TestResult> => {
  const entrypointFileName = testPath.replace(config.rootDir + '/', '');
  const result = await compileTest(entrypointFileName);

  if (result.status !== 'ok') {
    throw result.message;
  }

  const testSourceCode = findTestSourceCode(result, entrypointFileName);
  const testCases = await extractGetMethods(testSourceCode.contents);
  const fixtureGetters = filterFixtureGetters(testCases);

  const { executor, code, data } = await setupExecutor(result.codeBoc64);
  const fixtures = await extractFixtures(executor, code, data, fixtureGetters);
  const testNamePattern =
    globalConfig.testNamePattern &&
    new RegExp(globalConfig.testNamePattern, 'i');

  const {
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    testResults,
  } = await executeTestCases(
    testCases,
    fixtures,
    executor,
    code,
    data,
    testNamePattern,
  );

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

async function compileTest(entrypointFileName: string) {
  return await runTolkCompiler({
    entrypointFileName,
    fsReadCallback: (path: string) => readFileContent(path, entrypointFileName),
    withStackComments: true,
  });
}

function readFileContent(path: string, entrypointFileName: string): string {
  const content = fs.readFileSync(path).toString();
  if (
    path === entrypointFileName &&
    !content.match(/(^|\n)\s*\/\/\s+@no-main/)
  ) {
    return content + '\n\n' + 'fun main() {}';
  }
  return content;
}

function findTestSourceCode(
  result: TolkResultSuccess,
  entrypointFileName: string,
) {
  const testSourceCode = result.sourcesSnapshot.find(
    ({ filename }) => filename === entrypointFileName,
  );
  if (!testSourceCode) {
    throw new Error(
      `Expected behaviour: ${entrypointFileName} not found in a snapshot.`,
    );
  }
  return testSourceCode;
}

function filterFixtureGetters(
  getMethods: GetMethodDeclaration[],
): GetMethodDeclaration[] {
  return getMethods.filter((method) =>
    method.methodName.startsWith('fixture_'),
  );
}

async function setupExecutor(codeBoc64: string) {
  const executor = await Executor.create();
  const code = Cell.fromBase64(codeBoc64);
  const data = beginCell().endCell();
  return { executor, code, data };
}

async function executeTestCases(
  testCases: GetMethodDeclaration[],
  fixtures: Fixtures,
  executor: Executor,
  code: Cell,
  data: Cell,
  testNamePattern?: '' | RegExp,
) {
  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  const testResults: AssertionResult[] = [];

  for (const testCase of testCases) {
    const annotations = testCase.docBlock
      ? extractAnnotationsFromDocBlock(testCase.docBlock)
      : {};

    const isTest = testCase.methodName.startsWith('test_') || annotations.test;
    if (!isTest) {
      continue;
    }
    const testCaseName = testCase.methodName
      .replace(/^test_/, '')
      .replace(/_/g, ' ');

    if (
      annotations.skip ||
      (testNamePattern && !testNamePattern.test(testCase.methodName))
    ) {
      testResults.push(
        createTestResult('pending', testCaseName, annotations, 0),
      );
      numPendingTests += 1;
      continue;
    }

    if (annotations.todo) {
      testResults.push(createTestResult('todo', testCaseName, annotations, 0));
      numTodoTests += 1;
      continue;
    }

    try {
      const start = Date.now();
      const { output, input } = await runSingleTestCase(
        executor,
        code,
        data,
        testCase.methodId ?? getMethodId(testCase.methodName),
        annotations,
        fixtures,
        testCase.argTypes,
      );
      const end = Date.now();

      validateTestOutput(input, output, annotations);
      testResults.push(
        createTestResult('passed', testCaseName, annotations, end - start),
      );
      numPassingTests += 1;
    } catch (error) {
      testResults.push(
        createTestResult('failed', testCaseName, annotations, 0, error),
      );
      numFailingTests += 1;
    }
  }

  return {
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    testResults,
  };
}

async function runSingleTestCase(
  executor: Executor,
  code: Cell,
  data: Cell,
  methodId: number,
  annotations: TestAnnotations,
  fixtures: Fixtures,
  argTypes?: ArgType[],
): Promise<GetMethodResult & { input: TupleItem[] }> {
  return annotations.fuzz
    ? await executeFuzzTest(
        executor,
        code,
        data,
        methodId,
        annotations,
        fixtures,
        argTypes ?? [],
      )
    : await runGetMethodWithDefaults({
        executor,
        code,
        data,
        methodId,
        unixTime: annotations.unixTime,
        balance: annotations.balance,
        stack: undefined,
        gasLimit: annotations.gasLimit,
      });
}

function validateTestOutput(
  input: any[],
  output: GetMethodResultSuccess | GetMethodResultError,
  annotations: TestAnnotations,
) {
  if (!output.success) {
    throw `Execution failed: ${output.error}`;
  }

  const inputString =
    input && input.length ? `\n\nInput: ${convertInputToString(input)}` : '';

  if (annotations.exitCode) {
    assert.equal(
      output.vm_exit_code,
      annotations.exitCode,
      `Test case has thrown an error code ${output.vm_exit_code} (expected ${annotations.exitCode}).${inputString}`,
    );
  } else if (output.vm_exit_code !== 0) {
    const stackTrace = extractStackTrace(output.vm_log);
    throw new Error(
      `Test case has failed with an error code ${output.vm_exit_code}.\n\n[...]\n${stackTrace}${inputString}`,
    );
  }
}

function convertInputToString(input: TupleItem[]): string {
  return input
    .map((item) => {
      if (item.type === 'int') {
        return item.value.toString();
      } else if (['slice', 'cell', 'builder'].includes(item.type)) {
        // @ts-ignore
        return item.cell.toString();
      } else {
        return '';
      }
    })
    .join(', ');
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

function createTestResult(
  status: 'passed' | 'failed' | 'pending' | 'todo',
  title: string,
  annotations: TestAnnotations,
  duration: number,
  error?: unknown,
): AssertionResult {
  const failureMessage = error
    ? typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : `${error}`
    : '';
  return {
    duration,
    failureDetails: [],
    failureMessages: failureMessage ? [failureMessage] : [],
    numPassingAsserts: status === 'passed' ? 1 : 0,
    status,
    ancestorTitles: annotations.scope ? [annotations.scope] : [],
    title,
    fullName: title,
  };
}

export = runTest;
