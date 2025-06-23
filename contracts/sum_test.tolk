tolk 0.6

import "@stdlib/tvm-lowlevel.tolk"
import "../testing.tolk"
import "sum.tolk"

// @scope sum()
get test_returns_sum_of_numbers() {
    val a: int = 4;
    val b: int = 7;

    Assert.equal(calculateSum(a, b), a + b);
}

// @scope sum()
get test_fails_if_value_is_not_int() {
    test.expectExitCode(4); // integer overflow

    var x = 1 << 128;
    repeat (128) {
        x <<= 1;
    }
}

// @scope sum()
// @todo
get test_marked_as_todo() {
}

// @gasLimit 2000
get test_fails_because_of_out_of_gas() {
    test.expectExitCode(-14);

    repeat (1000) {
        beginCell().storeUint(random.uint256(), 256).endCell();
    }
}
