tolk 0.6

import "sum.tolk"

get fixture_x() {
    return (6, 7, 8, 9, 10);
}

get fixture_y() {
    return (1, 2, 3, 4, 5);
}

// @scope sum()
get test_returns_sum_of_numbers() {
    val a: int = 4;
    val b: int = 7;

    assert(calculateSum(a, b) == a + b) throw 100;
}

// @scope sum()
// @exitCode 7 (type check error)
get test_fails_if_value_is_not_int() {
    val a: int = null;
    val b: int = 7;

    calculateSum(a, b);
}

// @scope sum()
// @gasLimit 50
// @exitCode -14 (out of gas)
get test_fails_because_of_out_of_gas() {
    val a: int = 4;
    val b: int = 7;

    calculateSum(a, b);
}

// @scope sum()
// @todo
get test_marked_as_todo() {}

// @scope sum()
// @fuzz
// @runs 10
get test_fuzz_sum_of_numbers(a: int, b: int) {
    assert(calculateSum(a, b) == a + b) throw 101;
}

// @scope sum()
// @fuzz
get test_fuzz_sum_of_numbers_with_fixtures(x: int, y: int) {
    assert(calculateSum(x, y) == x + y) throw 101;
}

// @scope sum()
// @fuzz _ a:# b:uint12 = Args;
// @runs 100
get test_fuzz_sum_of_numbers_with_tlb(a: int, b: int) {
    assert(calculateSum(a, b) == a + b) throw 101;
}