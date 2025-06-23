import { BOLD_WEIGHT, EXPECTED_COLOR, RECEIVED_COLOR } from 'jest-matcher-utils';
import { Address, ExternalAddress } from '@ton/core';
import { DebugReader } from './utils/debug-reader';

const DEFAULT_ERROR = 'AssertError';

export const ASSERTIONS: { [instruction: string]: (debugReader: DebugReader) => void } = {
  ASSERT_COMPARE_INT: (debugReader: DebugReader) => {
    const type = debugReader.next();
    const expected = debugReader.nextBigInt();
    const actual = debugReader.nextBigInt();
    const error = debugReader.next();

    const prefix = BOLD_WEIGHT(error || DEFAULT_ERROR);

    switch (type) {
      case 'EQ':
        throw new Error(
          `${prefix} - Value "${BOLD_WEIGHT(actual.toString())}" does not equal expected value "${BOLD_WEIGHT(expected.toString())}".`,
        );

      case 'NEQ':
        throw new Error(
          `${prefix} - Value "${BOLD_WEIGHT(actual.toString())}" was not expected to be equal to value "${BOLD_WEIGHT(expected.toString())}".`,
        );

      case 'LT':
        throw new Error(
          `${prefix} - Provided "${BOLD_WEIGHT(actual.toString())}" is not less than "${BOLD_WEIGHT(expected.toString())}".`,
        );

      case 'LTE':
        throw new Error(
          `${prefix} - Provided "${BOLD_WEIGHT(actual.toString())}" is not less than or equal to "${BOLD_WEIGHT(expected.toString())}".`,
        );

      case 'GT':
        throw new Error(
          `${prefix} - Provided "${BOLD_WEIGHT(actual.toString())}" is not greater than "${BOLD_WEIGHT(expected.toString())}".`,
        );

      case 'GTE':
        throw new Error(
          `${prefix} - Provided "${BOLD_WEIGHT(actual.toString())}" is not greater than or equal to "${BOLD_WEIGHT(expected.toString())}".`,
        );

      default:
        console.log('ASSERT_COMPARE_INT', {
          type,
          expected,
          actual,
          error,
        });
    }
  },
  ASSERT_TUPLE_SIZE: (debugReader: DebugReader) => {
    const actual = debugReader.nextInt();
    const expected = debugReader.nextInt();
    const error = debugReader.next();

    throw new Error(
      `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Tuple does not contain exactly ${BOLD_WEIGHT(expected)} elements (${BOLD_WEIGHT(actual)} given).`,
    );
  },
  ASSERT_ADDRESS_TYPE: (debugReader: DebugReader) => {
    const expectedType = debugReader.next();
    const actual = debugReader.nextSlice().loadAddressAny();
    const error = debugReader.next();

    const getAddressType = (address: Address | ExternalAddress | null) => {
      if (address instanceof Address) return 'internal';
      if (address instanceof ExternalAddress) return 'external';

      return 'none';
    };

    const prefix = BOLD_WEIGHT(error || DEFAULT_ERROR);

    switch (expectedType) {
      case 'INTERNAL':
        throw new Error(`${prefix} - Address was expected to be internal (${BOLD_WEIGHT(getAddressType(actual))} given).`);
      case 'NONE':
        throw new Error(`${prefix} - Address was expected to be none (${BOLD_WEIGHT(getAddressType(actual))} given).`);
      case 'EXTERNAL':
        throw new Error(`${prefix} - Address was expected to be external (${BOLD_WEIGHT(getAddressType(actual))} given).`);
    }
  },
  ASSERT_IS_NULL: (debugReader: DebugReader) => {
    const expectNull = debugReader.next();
    const error = debugReader.next();

    throw new Error(
      expectNull
        ? `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Value is not null, but null value was expected.`
        : `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Value is null, but non null value was expected.`
    );
  },
  ASSERT_EQUAL_ADDRESS: (debugReader: DebugReader) => {
    const actual = debugReader.nextAddress();
    const expected = debugReader.nextAddress();
    const error = debugReader.next();

    throw new Error(
      `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Address does not equal expected one.\n\n` +
      `Expected: ${EXPECTED_COLOR(`"${expected}"`)}\n` +
      `Received: ${RECEIVED_COLOR(`"${actual}"`)}\n`,
    );
  },
  ASSERT_BOOL: (debugReader: DebugReader) => {
    const actual = debugReader.nextBool();
    const expected = debugReader.nextBool();
    const error = debugReader.next();

    throw new Error(
      `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Value "${BOLD_WEIGHT(actual)}" is not ${expected}.`
    );
  },
  ASSERT_CONSUME_LESS: (debugReader: DebugReader) => {
    const actual = debugReader.nextInt();
    const expected = debugReader.nextInt();
    const error = debugReader.next();

    throw new Error(
      `${BOLD_WEIGHT(error || DEFAULT_ERROR)} - Function consumed more than ${BOLD_WEIGHT(expected)} gas units (${BOLD_WEIGHT(actual)} consumed).`,
    );
  },
  ASSERT_FAIL: (debugReader: DebugReader) => {
    const message = debugReader.next();
    const error = debugReader.next();

    throw new Error(`${BOLD_WEIGHT(error || DEFAULT_ERROR)} - ${message}`);
  },
};
