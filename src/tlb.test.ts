import {
  extractTLBCode,
  extractIntFieldFromTLB,
  extractSliceFieldFromTLB,
} from './tlb';
import {
  TLBCode,
  TLBConstructor,
  TLBNumberExpr,
  TLBType,
} from '@ton-community/tlb-codegen';

describe('extractTLBCode', () => {
  it('should return TLBCode for valid fuzzTlb input', () => {
    const fuzzTlb = '_ a:int b:coins = Args;';
    const result = extractTLBCode(fuzzTlb);
    expect(result).toBeInstanceOf(TLBCode);
  });
});

describe('extractIntFieldFromTLB', () => {
  const mockTLBCode: TLBCode = {
    types: new Map([
      [
        'Args',
        new TLBType('Args', [
          new TLBConstructor(
            [], // parameters
            [], // variables
            new Map(), // variablesMap
            new Map(), // parametersMap
            'ArgsConstructor', // name
            [
              {
                name: 'field1',
                anonymous: false,
                fieldType: {
                  kind: 'TLBNumberType',
                  maxBits: 128,
                  signed: false,
                  storeBits: new TLBNumberExpr(128),
                  bits: new TLBNumberExpr(128),
                },
                subFields: [],
              },
              {
                name: 'field2',
                anonymous: false,
                fieldType: {
                  kind: 'TLBNamedType',
                  name: 'coins',
                  arguments: [],
                },
                subFields: [],
              },
            ],
            { bitLen: 0, binary: '' }, // tag
            [], // constraints
            '', // declaration
            '', // tlbType
          ),
        ]),
      ],
    ]),
  };

  it('should return correct bits and signed for TLBNumberType', () => {
    const result = extractIntFieldFromTLB(mockTLBCode, 'field1');
    expect(result).toEqual({ bits: 128, signed: false });
  });

  it('should return correct bits and signed for TLBNamedType coins', () => {
    const result = extractIntFieldFromTLB(mockTLBCode, 'field2');
    expect(result).toEqual({ bits: 120, signed: false });
  });

  it('should throw an error for non-TLBNumberType fields', () => {
    expect(() =>
      extractIntFieldFromTLB(mockTLBCode, 'nonExistentField'),
    ).toThrow('Field nonExistentField is not of type TLBNumberType');
  });
});

describe('extractSliceFieldFromTLB', () => {
  const mockTLBCode: TLBCode = {
    types: new Map([
      [
        'Args',
        new TLBType('Args', [
          new TLBConstructor(
            [], // parameters
            [], // variables
            new Map(), // variablesMap
            new Map(), // parametersMap
            'ArgsConstructor', // name
            [
              {
                name: 'field1',
                anonymous: false,
                fieldType: {
                  kind: 'TLBNamedType',
                  name: 'address',
                  arguments: [],
                },
                subFields: [],
              },
              {
                name: 'field2',
                anonymous: false,
                fieldType: {
                  kind: 'TLBNamedType',
                  name: 'other',
                  arguments: [],
                },
                subFields: [],
              },
            ],
            { bitLen: 0, binary: '' }, // tag
            [], // constraints
            '', // declaration
            '', // tlbType
          ),
        ]),
      ],
    ]),
  };

  it('should return "address" for address type', () => {
    const result = extractSliceFieldFromTLB(mockTLBCode, 'field1');
    expect(result).toBe('address');
  });

  it('should return "slice" for non-address type', () => {
    const result = extractSliceFieldFromTLB(mockTLBCode, 'field2');
    expect(result).toBe('slice');
  });
});
