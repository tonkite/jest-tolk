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

import { Cell, getMethodId, parseTuple, TupleItem } from '@ton/core';
import { Executor } from '@ton/sandbox';
import { GetMethodDeclaration } from './source-code';
import { runGetMethodWithDefaults } from './utils';

export interface Fixtures {
  [key: string]: TupleItem[];
}

export const extractFixtures = async (
  executor: Executor,
  code: Cell,
  data: Cell,
  fixtureGetters: GetMethodDeclaration[],
): Promise<Fixtures> => {
  const fixtures: Fixtures = {};

  for (const fixtureGetter of fixtureGetters) {
    const { output } = await runGetMethodWithDefaults({
      executor,
      code,
      data,
      methodId: fixtureGetter.methodId ?? getMethodId(fixtureGetter.methodName),
    });

    if (!output.success) {
      throw new Error(
        `Fixture getter ${fixtureGetter.methodName} failed: ${output.error}`,
      );
    }

    if (output.vm_exit_code !== 0) {
      throw new Error(
        `Fixture getter ${fixtureGetter.methodName} failed: ${output.vm_exit_code}`,
      );
    }

    fixtures[fixtureGetter.methodName] = parseTuple(
      Cell.fromBase64(output.stack),
    );
  }

  return fixtures;
};
