import { Address, Cell, TupleItemInt, TupleItemSlice } from '@ton/core';
import { generateSlice } from './slice-strategy';

describe('generateSlice', () => {
  it('returns a fixture cell if fixtures are provided', () => {
    const fixtures: TupleItemSlice[] = [{ type: 'slice', cell: Cell.EMPTY }];
    const result = generateSlice('slice', fixtures);
    expect(result).toBeInstanceOf(Cell);
    expect(result).toBe(fixtures[0].cell);
  });

  it('throws an error if a fixture is not of type slice', () => {
    const fixtures: TupleItemInt[] = [{ type: 'int', value: 42n }];
    expect(() => generateSlice(undefined, fixtures)).toThrow(
      'All fixtures must be of type slice, but got int',
    );
  });

  it('generates a random address when type is address and bias is towards random', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.95); // Bias towards random
    const result = generateSlice('address');
    const address = result.beginParse().loadAddress();
    expect(address).toBeDefined();
  });

  it('generates an edge address when type is address and bias is towards edge', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.05); // Bias towards edge
    const result = generateSlice('address');
    const address = result.beginParse().loadAddress();
    expect(address.hash.toString('hex')).toBe(
      '0000000000000000000000000000000000000000000000000000000000000000',
    );
  });

  it('generates a random slice when no type is provided', () => {
    const result = generateSlice();
    expect(result).toBeInstanceOf(Cell);
  });
});
