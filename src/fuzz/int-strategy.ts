import { TupleItem } from '@ton/core';
import { createIntTree, IntTree } from './int-tree';

export interface IntStrategy {
  generateTree: () => IntTree;
}

function generateRandom(bits: number, signed: boolean): bigint {
  const max = signed
    ? (BigInt(1) << BigInt(bits - 1)) - BigInt(1)
    : (BigInt(1) << BigInt(bits)) - BigInt(1);
  const value = BigInt(Math.floor(Math.random() * Number(max)));
  return signed && Math.random() < 0.5 ? -value : max;
}

function generateEdge(bits: number, signed: boolean): bigint {
  const EDGE_CASES: bigint[] = signed
    ? [
        BigInt(0),
        BigInt(1),
        BigInt(-1),
        (BigInt(1) << BigInt(bits - 1)) - BigInt(1),
        -(BigInt(1) << BigInt(bits - 1)),
      ]
    : [BigInt(0), BigInt(1), (BigInt(1) << BigInt(bits)) - BigInt(1)];
  return EDGE_CASES[Math.floor(Math.random() * EDGE_CASES.length)];
}

export function generateIntTree(
  bits: number,
  signed: boolean,
  fixtures?: TupleItem[],
): IntTree {
  if (fixtures && fixtures.length > 0) {
    fixtures.forEach((item) => {
      if (item.type !== 'int') {
        throw new Error(
          `All fixtures must be of type int, but got ${item.type}`,
        );
      }
    });

    return createIntTree(
      // @ts-ignore
      fixtures[Math.floor(Math.random() * fixtures.length)].value,
      bits,
      signed,
      true,
    );
  }

  const EDGE_WEIGHT = 10;
  const RANDOM_WEIGHT = 90;
  const totalWeight = EDGE_WEIGHT + RANDOM_WEIGHT;
  const bias = Math.floor(Math.random() * totalWeight);

  if (bias < EDGE_WEIGHT)
    return createIntTree(generateEdge(bits, signed), bits, signed);
  return createIntTree(generateRandom(bits, signed), bits, signed);
}
