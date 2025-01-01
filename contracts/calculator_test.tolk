// @no-main

import "calculator.tolk"

get test_sum() {
    assert(sum(5, 6) == 5 + 6) throw 500;
}
