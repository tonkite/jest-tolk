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

import { Address, beginCell, Cell, TupleItem, TupleItemSlice } from '@ton/core';
import { randomBytes } from 'node:crypto';

export function generateSlice(type?: string, fixtures?: TupleItem[]): Cell {
  if (fixtures && fixtures.length > 0) {
    fixtures.forEach((item) => {
      if (item.type !== 'slice') {
        throw new Error(
          `All fixtures must be of type slice, but got ${item.type}`,
        );
      }
    });

    return selectSlice(fixtures as TupleItemSlice[]);
  }

  if (type === 'address') {
    const EDGE_WEIGHT = 10;
    const RANDOM_WEIGHT = 90;
    const totalWeight = EDGE_WEIGHT + RANDOM_WEIGHT;
    const bias = Math.floor(Math.random() * totalWeight);

    if (bias < EDGE_WEIGHT) return generateEdgeAddress();
    return generateRandomAddress();
  }

  return generateRandomSlice();
}

function generateRandomAddress(): Cell {
  const workchain = Math.random() < 0.5 ? 0 : -1;
  return beginCell()
    .storeAddress(new Address(workchain, randomBytes(32)))
    .endCell();
}

function generateEdgeAddress(): Cell {
  const EDGE_CASES: Address[] = [
    Address.parseRaw(
      '0:0000000000000000000000000000000000000000000000000000000000000000',
    ),
    Address.parseRaw(
      '-1:0000000000000000000000000000000000000000000000000000000000000000',
    ),
  ];
  return beginCell()
    .storeAddress(EDGE_CASES[Math.floor(Math.random() * EDGE_CASES.length)])
    .endCell();
}

function selectSlice(fixtures: TupleItemSlice[]): Cell {
  const fixture = fixtures[Math.floor(Math.random() * fixtures.length)];
  return fixture.cell;
}

function generateRandomSlice(): Cell {
  const builder = beginCell();
  const size = Math.floor(Math.random() * 127);
  const refs = Math.floor(Math.random() * 4);

  builder.storeBuffer(randomBytes(size));

  for (let i = 0; i < refs; i++) {
    builder.storeRef(beginCell().storeBuffer(randomBytes(size)));
  }

  return builder.endCell();
}
