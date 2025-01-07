export interface IntTree {
  current: () => bigint;
  simplify: () => boolean;
  complicate: () => boolean;
}

export function createIntTree(
  start: bigint,
  bits: number,
  signed: boolean,
  fixed: boolean = false,
): IntTree {
  const max = signed
    ? (BigInt(1) << BigInt(bits - 1)) - BigInt(1)
    : (BigInt(1) << BigInt(bits)) - BigInt(1);
  const min = signed ? -(BigInt(1) << BigInt(bits - 1)) : BigInt(0);

  let lo: bigint = 0n;
  let hi: bigint = start;
  let curr: bigint = start;

  function magnitudeGreater(lhs: bigint, rhs: bigint): boolean {
    if (lhs === BigInt(0)) {
      return false;
    }

    return lhs > rhs !== lhs < BigInt(0);
  }

  function reposition(): boolean {
    const interval = hi - lo;
    const newMid = lo + interval / BigInt(2);

    if (newMid === curr) {
      return false;
    }

    curr = newMid;
    return true;
  }

  function current(): bigint {
    return curr;
  }

  function simplify(): boolean {
    if (fixed || !magnitudeGreater(hi, lo)) {
      return false;
    }

    hi = curr;
    return reposition();
  }

  function complicate(): boolean {
    if (fixed || !magnitudeGreater(hi, lo)) {
      return false;
    }

    lo =
      curr !== min && curr !== max
        ? curr + (hi < BigInt(0) ? BigInt(-1) : BigInt(1))
        : curr;

    return reposition();
  }

  return { current, simplify, complicate };
}
