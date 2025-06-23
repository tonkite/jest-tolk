import { TupleItem } from '@ton/core';

export function generateBoolValues(
  count: number,
): TupleItem[] {
  const result: TupleItem[] = [];

  while (result.length < count) {
    result.push({
      type: 'int',
      value: BigInt(Math.round(Math.random())),
    });
  }

  return result;
}
