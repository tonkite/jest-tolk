tolk 0.6

import "sum.tolk"

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
