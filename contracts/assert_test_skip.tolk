import "@stdlib/tvm-lowlevel.tolk"
import "../testing.tolk"

get test_expect_exit_code() {
    test.expectExitCode(500);
    throw 500;
}

get test_assert_equal() {
    Assert.equal(1000, 2000, "Assert.equal::1");
}

get test_assert_true() {
    Assert.isTrue(false, "Assert.isTrue::1");
}

get test_assert_equal_address() {
    Assert.equalAddress(
        contract.getAddress(),
        address("EQDcrR0jCWv7ivMCehE-0RkS73_L2nQu_SilnHWE8uD-VyAf"),
        "Assert.equalAddress::1",
    );
}

get test_assert_not_equal() {
    Assert.notEqual(2000, 2000, "Assert.notEqual::1");
}

get test_assert_is_null() {
    Assert.isNull(2000, "Assert.isNull::1");
}

get test_assert_not_null() {
    Assert.notNull(null, "Assert.notNull::1");
}

get test_assert_is_false() {
    Assert.isFalse(true, "Assert.isFalse::1");
}

get test_assert_greater_than() {
    Assert.greaterThan(10, 10, "Assert.greaterThan::1");
}

get test_assert_greater_than_or_equal() {
    Assert.greaterThanOrEqual(10, 8, "Assert.greaterThanOrEqual::1");
}

get test_assert_less_than() {
    Assert.lessThan(8, 8, "Assert.lessThan::1");
}

get test_assert_less_than_or_equal() {
    Assert.lessThanOrEqual(10, 8, "Assert.lessThanOrEqual::1");
}

get test_assert_size() {
    Assert.size(createEmptyTuple(), 5, "Assert.size::1");
}

get test_assert_is_internal_address() {
    Assert.isInternalAddress(createAddressNone(), "Assert.isInternalAddress::1");
}

get test_assert_is_none_address() {
    Assert.isNoneAddress(contract.getAddress(), "Assert.isNoneAddress::1");
}

get test_set_time() {
    val time = random.range(0xffffffff);
    Assert.notEqual(blockchain.now(), time);
    test.setTime(time);
    Assert.equal(blockchain.now(), time);
}

fun create100Cells() {
    repeat (100) {
        beginCell()
            .storeUint(random.uint256(), 256)
            .endCell();
    }
}

get test_consumes_less_than() {
    Assert.consumesLessThan(create100Cells, 2000, "Assert.consumesLessThan::1");
}

get test_set_balance() {
    val balance = ton("124000.35");
    Assert.notEqual(contract.getOriginalBalance(), balance);
    test.setOriginalBalance(balance);
    Assert.equal(contract.getOriginalBalance(), balance);
}

get test_fail() {
    Assert.fail("Check is unconditionally failed.", "Assert.fail::1");
}
