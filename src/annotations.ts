export interface TestAnnotations {
  exitCode?: number;
  scope?: string;
  balance?: bigint;
  gasLimit?: number;
  unixTime?: number;
}

export function extractAnnotationsFromDocBlock(
  docBlock: string,
): TestAnnotations {
  const annotations: TestAnnotations = {};
  const lines = docBlock.split('\n');

  for (const line of lines) {
    let matches;

    if ((matches = line.match(/@exitCode\s+(-?\d+)/))) {
      annotations.exitCode = parseInt(matches[1]);
    }

    if ((matches = line.match(/@scope\s+(.+)/))) {
      annotations.scope = matches[1];
    }

    if ((matches = line.match(/@balance\s+(\d+)/))) {
      annotations.balance = BigInt(matches[1]);
    }

    if ((matches = line.match(/@gasLimit\s+(\d+)/))) {
      annotations.gasLimit = parseInt(matches[1]);
    }

    if ((matches = line.match(/@unixTime\s+(\d+)/))) {
      annotations.unixTime = parseInt(matches[1]);
    }
  }

  return annotations;
}
