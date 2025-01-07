import { Cell, getMethodId, parseTuple, TupleItem } from '@ton/core';
import { Executor } from '@ton/sandbox';
import { GetMethodDeclaration } from '../source-code';
import { runGetMethodWithDefaults } from '../utils';

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
