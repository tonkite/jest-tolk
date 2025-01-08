import { Cell, serializeTuple } from '@ton/core';
import { Executor } from '@ton/sandbox';
import { extractFixtures } from './fixture';
import { GetMethodDeclaration } from './source-code';
import { runGetMethodWithDefaults } from './utils';

jest.mock('./utils', () => ({
  runGetMethodWithDefaults: jest.fn(),
}));

describe('extractFixtures', () => {
  let executor: Executor;
  let code: Cell;
  let data: Cell;
  let fixtureGetters: GetMethodDeclaration[];

  beforeEach(() => {
    executor = {} as Executor; // Mock or create a real Executor instance
    code = Cell.EMPTY;
    data = Cell.EMPTY;
    fixtureGetters = [
      { methodName: 'fixtureA' },
      { methodName: 'fixtureB', methodId: 1234 },
    ];
  });

  it('extracts fixtures successfully', async () => {
    (runGetMethodWithDefaults as jest.Mock).mockResolvedValue({
      output: {
        success: true,
        vm_exit_code: 0,
        stack: serializeTuple([{ type: 'int', value: 42n }]).toBoc(),
      },
    });

    const fixtures = await extractFixtures(
      executor,
      code,
      data,
      fixtureGetters,
    );

    expect(fixtures).toHaveProperty('fixtureA');
    expect(fixtures).toHaveProperty('fixtureB');
    expect(runGetMethodWithDefaults).toHaveBeenCalledTimes(2);
  });

  it('throws an error if a method fails', async () => {
    (runGetMethodWithDefaults as jest.Mock).mockResolvedValueOnce({
      output: {
        success: false,
        error: 'Some error',
      },
    });

    await expect(
      extractFixtures(executor, code, data, fixtureGetters),
    ).rejects.toThrow('Fixture getter fixtureA failed: Some error');
  });

  it('throws an error if vm_exit_code is not zero', async () => {
    (runGetMethodWithDefaults as jest.Mock).mockResolvedValueOnce({
      output: {
        success: true,
        vm_exit_code: 1,
      },
    });

    await expect(
      extractFixtures(executor, code, data, fixtureGetters),
    ).rejects.toThrow('Fixture getter fixtureA failed: 1');
  });
});
