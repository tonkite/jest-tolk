import { Cell, TupleItem } from '@ton/core';
import { generateInt } from './int-strategy';

describe('generateInt', () => {
  it('returns a fixture value if fixtures are provided', () => {
    const fixtures: TupleItem[] = [{ type: 'int', value: BigInt(42) }];
    const result = generateInt(8, false, fixtures);
    expect(result).toBe(42n);
  });

  it('throws an error if a fixture is not of type int', () => {
    const fixtures: TupleItem[] = [{ type: 'slice', cell: Cell.EMPTY }];
    expect(() => generateInt(8, false, fixtures)).toThrow(
      'All fixtures must be of type int, but got slice',
    );
  });

  it('generates a random integer when no fixtures are provided', () => {
    const result = generateInt(8, false);
    expect(typeof result).toBe('bigint');
  });

  it('generates an edge case integer when bias is towards edge', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.05); // Bias towards edge
    const result = generateInt(8, false);
    expect(typeof result).toBe('bigint');
    expect(result).toBe(0n);
  });

  it('generates a random integer when bias is towards random', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.95); // Bias towards random
    const result = generateInt(8, true);
    expect(typeof result).toBe('bigint');
    expect(result).toBe(120n);
  });
});
