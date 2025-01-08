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

import { getTLBCodeByAST, TLBCode } from '@ton-community/tlb-codegen';
import { ast } from '@ton-community/tlb-parser';

export function extractTLBCode(fuzzTlb: string): TLBCode {
  const tlbTree = ast(fuzzTlb);
  return getTLBCodeByAST(tlbTree, fuzzTlb);
}

export function extractIntFieldFromTLB(
  tlbCode: TLBCode,
  fieldName: string,
): {
  bits: number;
  signed: boolean;
} {
  const field = getFieldFromTLBCode(tlbCode, fieldName);

  switch (field?.fieldType?.kind) {
    case 'TLBNumberType':
      return {
        bits: field.fieldType.maxBits ?? 256,
        signed: field.fieldType.signed ?? true,
      };
    case 'TLBNamedType':
      if (['coins', 'grams'].includes(field.fieldType.name.toLowerCase())) {
        return {
          bits: 120,
          signed: false,
        };
      }
    default:
      throw new Error(`Field ${fieldName} is not of type TLBNumberType`);
  }
}

export function extractSliceFieldFromTLB(tlbCode: TLBCode, fieldName: string) {
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
