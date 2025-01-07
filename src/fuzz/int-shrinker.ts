import { IntTree } from './int-tree';

export interface IntShrinker {
  shrink: (tree: IntTree, test: (value: bigint) => boolean) => bigint;
}

export function createIntShrinker(): IntShrinker {
  function shrink(tree: IntTree, test: (value: bigint) => boolean): bigint {
    let lastValidValue = tree.current();

    while (tree.simplify()) {
      if (test(tree.current())) {
        lastValidValue = tree.current();
      }
    }

    while (tree.complicate()) {
      if (test(tree.current())) {
        lastValidValue = tree.current();
      }
    }

    return lastValidValue;
  }

  return { shrink };
}
