import "../testing.tolk"

fun div(x: int, y: int): int
    asm "DIV";

/** @runs 1000 */
get testFuzz_div(x: int8, y: uint16) {
    test.assume(y < 60000);

    if (y == 0) {
        test.expectExitCode(4); // division by zero
    }

    Assert.equal(x / y, div(x, y));
}
