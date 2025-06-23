import { Address, beginCell, ExternalAddress, TupleItem } from '@ton/core';
import { randomBytes } from 'node:crypto';

export function generateAddressValues(count: number): TupleItem[] {
  const result: TupleItem[] = [];

  const edgeCases = [
    null,
    new ExternalAddress(0n, 0),
    new ExternalAddress((1n << 511n) - 1n, 511),
  ];

  edgeCases.forEach((value) =>
    result.push({
      type: 'slice',
      cell: beginCell().storeAddress(value).endCell(),
    }),
  );

  while (result.length < count) {
    const workchain = Math.random() < 0.5 ? 0 : -1;

    result.push({
      type: 'slice',
      cell: beginCell()
        .storeAddress(new Address(workchain, randomBytes(32)))
        .endCell(),
    });
  }

  return result;
}
