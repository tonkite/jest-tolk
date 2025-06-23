import { TupleItem } from '@ton/core';

export function generateIntValues(
  bits: number,
  signed: boolean,
  count: number,
): TupleItem[] {
  const result: TupleItem[] = [];

  const edgeCases: bigint[] = signed
    ? [
        BigInt(0),
        BigInt(1),
        BigInt(-1),
        (BigInt(1) << BigInt(bits - 1)) - BigInt(1),
        -(BigInt(1) << BigInt(bits - 1)),
      ]
    : [BigInt(0), BigInt(1), (BigInt(1) << BigInt(bits)) - BigInt(1)];

  edgeCases.forEach((value) =>
    result.push({
      type: 'int',
      value,
    }),
  );

  while (result.length < count) {
    result.push({
      type: 'int',
      value: generateRandom(bits, signed),
    });
  }

  return result;
}

function generateRandom(bits: number, signed: boolean): bigint {
  const max = signed
    ? (BigInt(1) << BigInt(bits - 1)) - BigInt(1)
    : (BigInt(1) << BigInt(bits)) - BigInt(1);
  const value = BigInt(Math.floor(Math.random() * Number(max)));
  return signed && Math.random() < 0.5 ? -value : value;
}
