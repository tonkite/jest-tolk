import { toNano } from '@ton/core';
import { TestAnnotations } from './annotations';
import { Cell, Address } from '@ton/core';
import { randomBytes } from 'node:crypto';
import { defaultConfig, Executor } from '@ton/sandbox';

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
  stack = [],
  gasLimit = 10_000, // Default gas limit
}: RunGetMethodOptions) {
  return await executor.runGetMethod({
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
}
