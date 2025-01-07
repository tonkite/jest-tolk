import { Cell, TupleBuilder, TupleItem } from '@ton/core';
import { TestAnnotations } from '../annotations';
import { ArgType } from '../source-code';
import { generateIntTree } from './int-strategy';
import { IntTree } from './int-tree';
import { Executor } from '@ton/sandbox';
import { GetMethodResultError } from '@ton/sandbox/dist/executor/Executor';
import { GetMethodResultSuccess } from '@ton/sandbox/dist/executor/Executor';
import { Fixtures } from './fixture';
import { ast } from '@ton-community/tlb-parser';
import { getTLBCodeByAST, TLBCode } from '@ton-community/tlb-codegen';
import { runGetMethodWithDefaults } from '../utils';

const DEFAULT_RUNS = 10;

export async function executeFuzzTest(
  executor: Executor,
  code: Cell,
  data: Cell,
  methodId: number,
  annotations: TestAnnotations,
  fixtures: Fixtures,
  argTypes: ArgType[],
): Promise<{ output: GetMethodResultSuccess | GetMethodResultError }> {
  const runs = annotations.runs ?? DEFAULT_RUNS;
  let lastOutput: GetMethodResultSuccess | GetMethodResultError = {
    success: false,
    error: 'Not run yet',
  };

  for (let i = 0; i < runs; i++) {
    const trees = generateFuzzedTrees(argTypes, fixtures, annotations.fuzzTlb);
    const fuzzedStack = getStackFromTrees(argTypes, trees);

    const { output } = await runGetMethodWithDefaults({
      executor,
      code,
      data,
      methodId,
      unixTime: annotations.unixTime,
      balance: annotations.balance,
      stack: fuzzedStack,
      gasLimit: annotations.gasLimit,
    });

    lastOutput = output;

    if ((output as GetMethodResultSuccess).vm_exit_code !== 0) {
      // TODO: try to simplify the case
      break;
    }
  }
  return { output: lastOutput };
}

function generateFuzzedTrees(
  argTypes: ArgType[],
  fixtures: Fixtures,
  fuzzTlb?: string,
): IntTree[] {
  return argTypes.map((argType) => {
    if (argType.type === 'int') {
      const { bits, signed } = fuzzTlb
        ? extractIntFieldFromTLB(fuzzTlb, argType.name)
        : { bits: 256, signed: true };
      return generateIntTree(bits, signed, fixtures['fixture_' + argType.name]);
    }
    throw new Error(`Unsupported type: ${argType.type}`);
  });
}

function getStackFromTrees(
  argTypes: ArgType[],
  fuzzedTrees: IntTree[],
): TupleItem[] {
  const builder = new TupleBuilder();

  argTypes.forEach((argType, index) => {
    if (argType.type === 'int') {
      builder.writeNumber(fuzzedTrees[index].current());
    } else {
      throw new Error(`Unsupported type: ${argType}`);
    }
  });

  return builder.build();
}

function extractIntFieldFromTLB(
  tlb: string,
  fieldName: string,
): {
  bits: number;
  signed: boolean;
} {
  const tlbTree = ast(tlb);
  const tlbCode = getTLBCodeByAST(tlbTree, tlb);
  const field = getFieldFromTLBCode(tlbCode, fieldName);

  if (field?.fieldType?.kind !== 'TLBNumberType') {
    throw new Error(`Field ${fieldName} is not of type TLBNumberType`);
  }

  return {
    bits: field.fieldType.maxBits ?? 256,
    signed: field.fieldType.signed ?? true,
  };
}

function getFieldFromTLBCode(tlbCode: TLBCode, fieldName: string) {
  return tlbCode?.types
    .get('Args')
    ?.constructors[0].fields.find((field) => field.name === fieldName);
}
