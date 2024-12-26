import { extractAnnotationsFromDocBlock } from './annotations';

describe('extractAnnotationsFromDocBlock()', () => {
  it('extracts @exitCode', () => {
    expect(
      extractAnnotationsFromDocBlock('// @exitCode 3010 (an ignored comment)'),
    ).toEqual({
      exitCode: 3010,
    });
  });

  it('extracts @scope', () => {
    expect(extractAnnotationsFromDocBlock('// @scope myCustomScope')).toEqual({
      scope: 'myCustomScope',
    });
  });

  it('extracts @balance', () => {
    expect(extractAnnotationsFromDocBlock('// @balance 20000000')).toEqual({
      balance: 20000000n,
    });
  });

  it('extracts @gasLimit', () => {
    expect(extractAnnotationsFromDocBlock('// @gasLimit 50000')).toEqual({
      gasLimit: 50000,
    });
  });

  it('extracts @unixTime', () => {
    expect(extractAnnotationsFromDocBlock('// @unixTime 1735231203')).toEqual({
      unixTime: 1735231203,
    });
  });
});
