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

import { Cell, Address, TupleItem } from '@ton/core';
import { randomBytes } from 'node:crypto';
import { defaultConfig, Executor } from '@ton/sandbox';
import { GetMethodResult } from '@ton/sandbox/dist/executor/Executor';

interface RunGetMethodOptions {
  executor: Executor;
  code: Cell;
  data: Cell;
  methodId: number;
  unixTime?: number;
  balance?: bigint;
  stack?: any[];
  gasLimit?: number;
}

export async function runGetMethodWithDefaults({
  executor,
  code,
  data,
  methodId,
  unixTime = Math.floor(Date.now() / 1000), // Default to current time
  balance = BigInt(1_000_000_000), // Default to 1 TON
  stack = [] as TupleItem[],
  gasLimit = 10_000, // Default gas limit
}: RunGetMethodOptions): Promise<GetMethodResult & { input: TupleItem[] }> {
  const result = await executor.runGetMethod({
    code,
    data,
    methodId,
    unixTime,
    balance,
    stack,
    address: new Address(0, randomBytes(32)),
    randomSeed: randomBytes(32),
    verbosity: 'full_location_stack_verbose',
    config: defaultConfig,
    gasLimit: BigInt(gasLimit),
    debugEnabled: false,
  });
  return { ...result, input: stack };
}
