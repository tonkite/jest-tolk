import { extractAnnotationsFromDocBlock } from './annotations';

describe('extractAnnotationsFromDocBlock()', () => {
  it('extracts @scope', () => {
    expect(extractAnnotationsFromDocBlock('// @scope myCustomScope')).toEqual({
      scope: 'myCustomScope',
    });
  });

  it('extracts @runs', () => {
    expect(extractAnnotationsFromDocBlock('// @runs 1200')).toEqual({
      runs: 1200,
    });
  });

  it('extracts @gasLimit', () => {
    expect(extractAnnotationsFromDocBlock('// @gasLimit 50000')).toEqual({
      gasLimit: 50000,
    });
  });

  it('extracts @skip', () => {
    expect(extractAnnotationsFromDocBlock('// @skip')).toEqual({
      skip: true,
    });
  });

  it('extracts @todo', () => {
    expect(extractAnnotationsFromDocBlock('// @todo')).toEqual({
      todo: true,
    });
  });
});
