/**
 * Copyright 2024 Scaleton Labs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TupleItem } from '@ton/core';

export function generateInt(
  bits: number,
  signed: boolean,
  fixtures?: TupleItem[],
): bigint {
  if (fixtures && fixtures.length > 0) {
    fixtures.forEach((item) => {
      if (item.type !== 'int') {
        throw new Error(
          `All fixtures must be of type int, but got ${item.type}`,
        );
      }
    });

    // @ts-ignore
    return fixtures[Math.floor(Math.random() * fixtures.length)].value;
  }

  const EDGE_WEIGHT = 10;
  const RANDOM_WEIGHT = 90;
  const totalWeight = EDGE_WEIGHT + RANDOM_WEIGHT;
  const bias = Math.floor(Math.random() * totalWeight);

  if (bias < EDGE_WEIGHT) return generateEdge(bits, signed);
  return generateRandom(bits, signed);
}

function generateRandom(bits: number, signed: boolean): bigint {
  const max = signed
    ? (BigInt(1) << BigInt(bits - 1)) - BigInt(1)
    : (BigInt(1) << BigInt(bits)) - BigInt(1);
  const value = BigInt(Math.floor(Math.random() * Number(max)));
  return signed && Math.random() < 0.5 ? -value : value;
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
