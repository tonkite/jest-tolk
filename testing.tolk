import "@stdlib/gas-payments.tolk"

/// Container for test-helper routines.
struct test {
}

/// Expect the current test to terminate with a given exit-code.
fun test.expectExitCode(exitCode: int) {
    debug.printString("TEST_EXIT_CODE");
    debug.print(exitCode);
}

/// Abort further checks if the given condition is false.
fun test.assume(condition: bool) {
    if (!condition) {
        debug.printString("TEST_ASSUME");
        throw 1;
    }
}

/// Read control register C7.
fun test.getC7(): tuple
    asm "c7 PUSHCTR";

/// Write a new value to control register C7.
fun test.setC7(c7: tuple): void
    asm "c7 POPCTR";

/// Generic helper to overwrite a single config parameter.
@inline
fun test.setConfigParam<T>(value: T, index: int) {
    var c7 = test.getC7();
    var params: tuple = c7.get(0);
    params.set(value, index);
    c7.set(params, 0);
    test.setC7(c7);
}

/// Override `blockchain.now()` for deterministic testing.
@inline
fun test.setTime(now: int) {
    test.setConfigParam(now, 3);
}

/// Override the **block** logical time.
@inline
fun test.setBlockLogicalTime(blockLogicalTime: int) {
    test.setConfigParam(blockLogicalTime, 4);
}

/// Override the **transaction** logical time.
@inline
fun test.setLogicalTime(logicalTime: int) {
    test.setConfigParam(logicalTime, 5);
}

/// Override the original balance of the contract.
@inline
fun test.setOriginalBalance(balance: coins, extraCurrencies: dict = null) {
    test.setConfigParam([balance, extraCurrencies], 7);
}

/// Collection of assertion helpers for unit tests.
struct Assert {

}

fun _failIntComparison(compareType: slice, actual: int, expected: int, error: slice) {
    debug.printString("ASSERT_COMPARE_INT");
    debug.printString(compareType);
    debug.print(actual);
    debug.print(expected);
    debug.printString(error);
}

/// Assert `actual == expected`.
fun Assert.equal(actual: int, expected: int, error: slice = "") {
    if (expected != actual) {
        _failIntComparison("EQ", actual, expected, error);
        throw 1;
    }
}

/// Assert `actual != expected`.
fun Assert.notEqual(actual: int, expected: int, error: slice = "") {
    if (expected == actual) {
        _failIntComparison("NEQ", actual, expected, error);
        throw 1;
    }
}

/// Assert two addresses are identical.
fun Assert.equalAddress(actual: address, expected: address, error: slice = "") {
    if (expected != actual) {
        debug.printString("ASSERT_EQUAL_ADDRESS");
        debug.print(actual);
        debug.print(expected);
        debug.printString(error);
        throw 1;
    }
}

/// Assert value is **null**.
fun Assert.isNull<T>(actual: T, error: slice = "") {
    if (actual != null) {
        debug.printString("ASSERT_IS_NULL");
        debug.printString(true); // expect null = true
        debug.printString(error);
    }
}

/// Assert value is **not** null.
fun Assert.notNull<T>(actual: T, error: slice = "") {
    if (actual == null) {
        debug.printString("ASSERT_IS_NULL");
        debug.printString(false); // expect null = false
        debug.printString(error);
    }
}

/// Assert a boolean is true.
fun Assert.isTrue(actual: bool, error: slice = "") {
    if (!actual) {
        debug.printString("ASSERT_BOOL");
        debug.print(actual);
        debug.print(true);
        debug.printString(error);
        throw 1;
    }
}

/// Assert a boolean is false.
fun Assert.isFalse(actual: bool, error: slice = "") {
    if (actual) {
        debug.printString("ASSERT_BOOL");
        debug.print(actual);
        debug.print(false);
        debug.printString(error);
        throw 1;
    }
}

/// Assert `actual > expected`.
fun Assert.greaterThan(actual: int, expected: int, error: slice = "") {
    if (actual <= expected) {
        _failIntComparison("GT", actual, expected, error);
        throw 1;
    }
}

/// Assert `actual >= expected`.
fun Assert.greaterThanOrEqual(actual: int, expected: int, error: slice = "") {
    if (actual < expected) {
        _failIntComparison("GTE", actual, expected, error);
        throw 1;
    }
}

/// Assert `actual < expected`.
fun Assert.lessThan(actual: int, expected: int, error: slice = "") {
    if (actual >= expected) {
        _failIntComparison("LT", actual, expected, error);
        throw 1;
    }
}

/// Assert `actual <= expected`.
fun Assert.lessThanOrEqual(actual: int, expected: int, error: slice = "") {
    if (actual > expected) {
        _failIntComparison("LTE", actual, expected, error);
        throw 1;
    }
}

/// Assert the size of a tuple equals an expected value.
///
/// @param actual       Tuple to measure.
/// @param expectedSize Required length.
fun Assert.size(actual: tuple, expectedSize: int, error: slice = "") {
    if (actual.size() != expectedSize) {
        debug.printString("ASSERT_TUPLE_SIZE");
        debug.print(actual.size());
        debug.print(expectedSize);
        debug.printString(error);
        throw 1;
    }
}

fun _failAssertAddressTypeAssert(addressType: slice, actual: address, error: slice) {
    debug.printString("ASSERT_ADDRESS_TYPE");
    debug.printString(addressType);
    debug.print(actual);
    debug.printString(error);
}

/// Assert an address is **internal** (`std_addr`).
fun Assert.isInternalAddress(actual: address, error: slice = "") {
    if (!actual.isInternal()) {
        _failAssertAddressTypeAssert("INTERNAL", actual, error);
    }
}

/// Assert an address is the **none** address (`addr_none`).
fun Assert.isNoneAddress(actual: address, error: slice = "") {
    if (!actual.isNone()) {
        _failAssertAddressTypeAssert("NONE", actual, error);
    }
}

/// Assert an address is **external** (`addr_extern`).
fun Assert.isExternalAddress(actual: address, error: slice = "") {
    if (!actual.isInternal()) {
        _failAssertAddressTypeAssert("EXTERNAL", actual, error);
    }
}

/// Assert that executing `fn` consumes **≤ expected** gas.
///
/// @param fn        Closure to measure.
/// @param expected  Maximum allowed gas units.
fun Assert.consumesLessThan(fn: () -> void, expected: int, error: slice = "") {
    val start = getGasConsumedAtTheMoment();
    fn();
    val consumed = getGasConsumedAtTheMoment() - start;
    if (consumed > expected) {
        debug.printString("ASSERT_CONSUME_LESS");
        debug.print(consumed);
        debug.print(expected);
        debug.printString(error);
        throw 1;
    }
}

/// Force an immediate assertion failure.
///
/// @param message  Human-readable reason for the failure.
/// @param error    Custom error code (optional).
fun Assert.fail(message: slice, error: slice = "") {
    debug.printString("ASSERT_FAIL");
    debug.printString(message);
    debug.printString(error);
    throw 1;
}
