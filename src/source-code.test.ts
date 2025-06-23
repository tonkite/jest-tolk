import { extractGetMethods } from './source-code';

describe('extractGetMethods', () => {
  it('extracts get-methods names', () => {
    expect(
      extractGetMethods(`
      get test_case_1() {}
    `),
    ).resolves.toEqual([
      {
        methodName: 'test_case_1',
        parameters: [],
      },
    ]);
  });

  it('extracts get-methods @method_id', () => {
    expect(
      extractGetMethods(`
      @method_id(5858)
      get test_case_1() {}
    `),
    ).resolves.toEqual([
      {
        methodName: 'test_case_1',
        methodId: 5858,
        parameters: [],
      },
    ]);
  });

  it('extracts get-methods doc-blocks', () => {
    expect(
      extractGetMethods(`
      // @exitCode 50
      // @gasLimit
      get test_case_1() {}
    `),
    ).resolves.toEqual([
      {
        methodName: 'test_case_1',
        docBlock: '@exitCode 50\n@gasLimit',
        parameters: [],
      },
    ]);
  });

  it('extracts get-methods arguments', () => {
    expect(
      extractGetMethods(`
      get test_case_1(a: uint3, b: bool, c: address) {}
    `),
    ).resolves.toEqual([
      {
        methodName: 'test_case_1',
        parameters: [
          { name: 'a', type: 'uint3' },
          { name: 'b', type: 'bool' },
          { name: 'c', type: 'address' }
        ],
      },
    ]);
  });
});
