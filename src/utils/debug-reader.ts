import { Address, Slice } from '@ton/core';
import { loadSliceFromBOC } from './cell';

export class DebugReader {
  protected index = 0;

  constructor(protected readonly entries: string[]) {}

  static fromLogs(logs: string) {
    return new DebugReader(
      logs
        .split(/#DEBUG#: /)
        .filter((item) => !!item)
        .map((item) => item.trim()),
    );
  }

  next(): string {
    const entry = this.entries[this.index];
    this.index++;
    return entry;
  }

  protected nextAsStackItem(): string {
    const entry = this.next();
    return entry.replace(/^s\d+ = /, '');
  }

  nextInt(): number {
    return parseInt(this.nextAsStackItem(), 10);
  }

  nextBigInt(): bigint {
    return BigInt(this.nextAsStackItem());
  }

  nextBool(): boolean {
    return this.nextAsStackItem() !== '0';
  }

  nextSlice(): Slice {
    const stackItem = this.nextAsStackItem();
    const matches = stackItem.match(
      /^CS{Cell{([a-f0-9]+)} bits: (\d+)..(\d+); refs: (\d+)..(\d+)}/,
    );

    if (!matches) {
      throw new Error(`Slice entry expected. Given: ${stackItem}`);
    }

    const data = loadSliceFromBOC(Buffer.from(matches[1], 'hex'));
    const offset = parseInt(matches[2]);

    data.skip(offset);

    return data.clone();
  }

  nextAddress(): Address {
    return this.nextSlice().loadAddress();
  }

  isEOF() {
    return this.index >= this.entries.length;
  }
}
