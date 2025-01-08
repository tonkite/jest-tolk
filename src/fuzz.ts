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

import { Cell, TupleBuilder, TupleItem } from '@ton/core';
import { TestAnnotations } from './annotations';
import { ArgType } from './source-code';
import { generateInt } from './int-strategy';
import { Executor } from '@ton/sandbox';
import { GetMethodResult } from '@ton/sandbox/dist/executor/Executor';
import { GetMethodResultSuccess } from '@ton/sandbox/dist/executor/Executor';
import { Fixtures } from './fixture';
import { ast } from '@ton-community/tlb-parser';
import { getTLBCodeByAST, TLBCode } from '@ton-community/tlb-codegen';
import { runGetMethodWithDefaults } from './utils';
import { generateSlice } from './slice-strategy';

const DEFAULT_RUNS = 10;

export async function executeFuzzTest(
  executor: Executor,
  code: Cell,
  data: Cell,
  methodId: number,
  annotations: TestAnnotations,
  fixtures: Fixtures,
  argTypes: ArgType[],
): Promise<GetMethodResult & { input: TupleItem[] }> {
  const runs = annotations.runs ?? DEFAULT_RUNS;
  let lastResult: GetMethodResult & { input: any[] } = {
    output: {
      success: false,
      error: 'Not run yet',
    },
    logs: '',
    debugLogs: '',
    input: [],
  };

  const tlbTree = annotations.fuzzTlb ? ast(annotations.fuzzTlb) : undefined;
  const tlbCode =
    tlbTree && annotations.fuzzTlb
      ? getTLBCodeByAST(tlbTree, annotations.fuzzTlb)
      : undefined;

  for (let i = 0; i < runs; i++) {
    const stack = generateFuzzedStack(argTypes, fixtures, tlbCode);
    let result = await runGetMethodWithDefaults({
      executor,
      code,
      data,
      methodId,
      unixTime: annotations.unixTime,
      balance: annotations.balance,
      stack,
      gasLimit: annotations.gasLimit,
    });

    lastResult = result;
    if (
      (result.output as GetMethodResultSuccess).vm_exit_code !==
      (annotations.exitCode ?? 0)
    ) {
      break;
    }
  }
  return lastResult;
}

function generateFuzzedStack(
  argTypes: ArgType[],
  fixtures: Fixtures,
  tlbCode?: TLBCode,
): TupleItem[] {
  const builder = new TupleBuilder();

  argTypes.forEach((argType) => {
    switch (argType.type) {
      case 'int':
        const { bits, signed } = tlbCode
          ? extractIntFieldFromTLB(tlbCode, argType.name)
          : { bits: 256, signed: true };

        builder.writeNumber(
          generateInt(bits, signed, fixtures['fixture_' + argType.name]),
        );
        break;
      case 'slice':
        const type = tlbCode
          ? extractSliceFieldFromTLB(tlbCode, argType.name)
          : 'slice';

        builder.writeSlice(
          generateSlice(type, fixtures['fixture_' + argType.name]),
        );
        break;
      default:
        throw new Error(`Unsupported type: ${argType.type}`);
    }
  });

  return builder.build();
}

function extractIntFieldFromTLB(
  tlbCode: TLBCode,
  fieldName: string,
): {
  bits: number;
  signed: boolean;
} {
  const field = getFieldFromTLBCode(tlbCode, fieldName);

  if (field?.fieldType?.kind !== 'TLBNumberType') {
    throw new Error(`Field ${fieldName} is not of type TLBNumberType`);
  }

  return {
    bits: field.fieldType.maxBits ?? 256,
    signed: field.fieldType.signed ?? true,
  };
}

function extractSliceFieldFromTLB(tlbCode: TLBCode, fieldName: string) {
  const field = getFieldFromTLBCode(tlbCode, fieldName);

  if (
    field?.fieldType?.kind === 'TLBNamedType' &&
    field?.fieldType?.name.toLowerCase() === 'address'
  ) {
    return 'address';
  }

  return 'slice';
}

function getFieldFromTLBCode(tlbCode: TLBCode, fieldName: string) {
  return tlbCode?.types
    .get('Args')
    ?.constructors[0].fields.find((field) => field.name === fieldName);
}
