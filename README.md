<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tonkite/tonkite/main/assets/logo-dark.svg">
    <img alt="tonkite logo" src="https://raw.githubusercontent.com/tonkite/tonkite/main/assets/logo-light.svg" width="384" height="auto">
  </picture>
</p>

<p align="center">
  <a href="https://ton.org"><img alt="Based on TON" src="https://img.shields.io/badge/Based%20on-TON-blue"></a>
  <a href="https://github.com/tonkite/tonkite"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/tonkite/tonkite"></a>
  <a href="https://t.me/tonkite"><img alt="Telegram Channel" src="https://img.shields.io/badge/Telegram%20-@tonkite-24A1DE"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-green.svg"></a>
</p>

---

# Jest Runner for Tolk

A Jest runner that enables you to write and execute unit tests for Tolk code using familiar testing patterns.

## Example

Consider a simple Tolk function in `sum.tolk`:

```kotlin
fun calculateSum(a: int, b: int) {
    return a + b;
}
```

You can write unit tests for this function using Tolk:

```kotlin
import "../node_modules/@tonkite/jest-tolk/testing.tolk"
import "sum.tolk"

// @scope sum()
get test_returns_sum_of_numbers() {
    val a: int = 4;
    val b: int = 7;

    assert(calculateSum(a, b) == a + b) throw 100;
}

fun cast<T, X>(value: X): T asm "NOP";

// @scope sum()
get test_fails_if_value_is_not_int() {
    test.expectExitCode(7); // type check error

    val a: int = cast<int>(null);
    val b: int = 7;

    calculateSum(a, b);
}
```

Test result:

<img alt="Result" src="./images/test-result.png" width="343" height="auto">

## Installation

1. Install `@tonkite/jest-tolk`:
   ```shell
   pnpm add -D @tonkite/jest-tolk
   ```
2. Add runner configuration to `jest.config.ts`:

   ```typescript
   import type { Config } from 'jest';

   const config: Config = {
     projects: [
       {
         displayName: 'test',
         preset: 'ts-jest',
         testEnvironment: 'node',
         testPathIgnorePatterns: ['/node_modules/', '/dist/'],
       },
       {
         displayName: 'tolk',
         moduleFileExtensions: ['tolk'],
         testMatch: ['**/*[._]test.tolk'],
         runner: '@tonkite/jest-tolk',
       },
     ],
   };

   export default config;
   ```

## Fuzzing

The Runner comes with native fuzz-testing support. For every fuzz test (starting from `testFuzz_`) it:

1. Generates random values for each argument.

2. Executes the test repeatedly (default 100 runs).

3. Stops on the first failure and prints the failing inputs.

Adjust the iteration count with the `@runs` annotation.

### Fuzz-able types

- Signed and unsigned integers of any width — `int`, `int8`, `uint231`, etc.
(`bool` is treated as a one-bit unsigned int).
- `address` (including `addr_std`, `addr_extern` and `addr_none`)

### Example:

```kotlin
fun div(x: int, y: int): int
    asm "DIV";

/** @runs 1000 */
get testFuzz_div(x: int8, y: uint16) {
    if (y == 0) {
        test.expectExitCode(4); // division by zero
    }

    Assert.equal(x / y, div(x, y));
}
```

## Annotations

The runner allows you to configure the behavior of tests using special annotations in comments.

### Example:

```kotlin
/**
 * @scope examples
 */
get test_fail_with_exit_code_500() {
    test.expectExitCode(500);
    throw 500;
}
```

### Supported Annotations:

| Annotation              | Example                  | Description                                                                            |
|:------------------------|:-------------------------|:---------------------------------------------------------------------------------------|
| `@scope [scope]`        | `// @scope Pool::onSwap` | Specifies the scope of a test (useful for test grouping).                              |
| `@skip`                 | `// @skip`               | Marks a test to be skipped.                                                            |
| `@todo`                 | `// @todo`               | Marks a test to be done later.                                                         |
| `@gasLimit [gas limit]` | `// @gasLimit 50000`     | Sets a gas limit for a test. Default: `10000`.                                         |
| `@runs [runs]`          | `// @runs 1000`          | Sets a number of iterations for fuzzing. Default: `100`.                               |
| `@no-main`              | `// @no-main`            | Disables adding an entrypoint `fun main() {}` to avoid collision with an existing one. |

## Test Helpers & Assertions

### Test Helpers

* **`test.expectExitCode(exitCode: int)`**
  Signals that the *current test* must terminate with `exitCode`. The runner fails the test if any other exit code (or none) is produced.

* **`test.assume(condition: bool)`**
  Skips the remainder of the test when `condition` is `false`. Useful in fuzz/property tests to ignore meaningless input.

* **`test.getC7(): tuple`**
  Returns the current value of control register *C7*.

* **`test.setC7(c7: tuple)`**
  Replaces the entire *C7* register with `c7`. Use with care.

* **`test.setConfigParam<T>(value: T, index: int)`**
  Internal helper that overwrites **one slot** in `C7` (`value` is generic).

* **`test.setTime(now: int)`**
  Overrides `blockchain.now()` for deterministic testing (config-param #3).

* **`test.setBlockLogicalTime(blockLT: int)`**
  Overrides the **block** logical-time stamp (config-param #4).

* **`test.setLogicalTime(lt: int)`**
  Overrides the **transaction** logical-time stamp (config-param #5).

* **`test.setOriginalBalance(balance: coins, extraCurrencies: dict? = null)`**
  Fakes the contract’s starting balance (config-param #7).

### Assertions

* **`Assert.equal(actual: int, expected: int, msg: slice = "")`**
* **`Assert.notEqual(actual: int, expected: int, msg: slice = "")`**
* **`Assert.equalAddress(actual: address, expected: address, msg: slice = "")`**
* **`Assert.isNull<T>(value: T, msg: slice = "")`**
* **`Assert.notNull<T>(value: T, msg: slice = "")`**
* **`Assert.isTrue(flag: bool, msg: slice = "")`**
* **`Assert.isFalse(flag: bool, msg: slice = "")`**
* **`Assert.greaterThan(a: int, b: int, msg: slice = "")`**
* **`Assert.greaterThanOrEqual(a: int, b: int, msg: slice = "")`**
* **`Assert.lessThan(a: int, b: int, msg: slice = "")`**
* **`Assert.lessThanOrEqual(a: int, b: int, msg: slice = "")`**
* **`Assert.size(t: tuple, expected: int, msg: slice = "")`**
* **`Assert.isInternalAddress(addr: address, msg: slice = "")`**
* **`Assert.isExternalAddress(addr: address, msg: slice = "")`**
* **`Assert.isNoneAddress(addr: address, msg: slice = "")`**
* **`Assert.consumesLessThan(fn: () -> void, gasLimit: int, msg: slice = "")`**
* **`Assert.fail(message: slice, code: slice = "")`**

### Example Usage

```func
get sample_test() {
    ;; Freeze time and set deterministic logical-times
    test.setTime(1_726_689_600);          ;; 2025-06-23 UTC
    test.setBlockLogicalTime(1_234_567);
    test.setLogicalTime(1_234_568);

    ;; Basic assertions
    Assert.isTrue(2 + 2 == 4);
    Assert.equal(0xdead, 0xdead);

    ;; Expect exit-code 13 from the next call
    test.expectExitCode(13);
    myContract.someDangerousCall();
}
```

Happy testing 🚀

## License

<a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-green.svg" alt="License"></a>
