import { BitReader, BitString, Slice } from '@ton/core';

function getHashesCountFromMask(mask: number) {
  let n = 0;
  for (let i = 0; i < 3; i++) {
    n += mask & 1;
    mask = mask >> 1;
  }
  return n + 1; // 1 repr + up to 3 higher hashes
}

function getHashesCount(levelMask: number) {
  return getHashesCountFromMask(levelMask & 7);
}

export function loadSliceFromBOC(buffer: Buffer) {
  const reader = new BitReader(new BitString(buffer, 0, buffer.length * 8));

  // D1
  const d1 = reader.loadUint(8);
  const refsCount = d1 % 8;
  const exotic = !!(d1 & 8);

  // D2
  const d2 = reader.loadUint(8);
  const dataBytesize = Math.ceil(d2 / 2);
  const paddingAdded = !!(d2 % 2);

  const levelMask = d1 >> 5;
  const hasHashes = (d1 & 16) != 0;
  const hash_bytes = 32;

  const hashesSize = hasHashes ? getHashesCount(levelMask) * hash_bytes : 0;
  const depthSize = hasHashes ? getHashesCount(levelMask) * 2 : 0;

  reader.skip(hashesSize * 8);
  reader.skip(depthSize * 8);

  // Bits
  let bits = BitString.EMPTY;
  if (dataBytesize > 0) {
    if (paddingAdded) {
      bits = reader.loadPaddedBits(dataBytesize * 8);
    } else {
      bits = reader.loadBits(dataBytesize * 8);
    }
  }

  // Result
  return new Slice(new BitReader(bits), []);
}
