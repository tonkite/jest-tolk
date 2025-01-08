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

## Annotations

The runner allows you to configure the behavior of tests using special annotations in comments.

### Example:

```kotlin
/**
 * @test
 * @scope examples
 * @exitCode 500
 */
get should_fail_with_exit_code_500() {
    throw 500;
}
```

### Supported Annotations:

| Annotation              | Example                   | Description                                                                            |
| :---------------------- | :------------------------ | :------------------------------------------------------------------------------------- |
| `@exitCode [exitCode]`  | `// @exitCode 500`        | Specifies the expected exit code. Default: `0`.                                        |
| `@scope [scope]`        | `// @scope Pool::onSwap`  | Specifies the scope of a test (useful for test grouping).                              |
| `@skip`                 | `// @skip`                | Marks a test to be skipped.                                                            |
| `@todo`                 | `// @todo`                | Marks a test to be done later.                                                         |
| `@test`                 | `// @test`                | Marks a get-method (which isn't prefixed by `test_`) as a test.                        |
| `@balance [balance]`    | `// @balance 1000000000`  | Sets a balance for a test. Default: `1000000000` (1 TON).                              |
| `@gasLimit [gas limit]` | `// @gasLimit 50000`      | Sets a gas limit for a test. Default: `10000`.                                         |
| `@unixTime [unix time]` | `// @unixTime 1735231203` | Sets a Unix time for a test. Default: current time.                                    |
| `@no-main`              | `// @no-main`             | Disables adding an entrypoint `fun main() {}` to avoid collision with an existing one. |
| `@fuzz [tlb]`           | `// @fuzz _ a:# = Args;`  | Marks a test as a fuzz test with optional TLB for test arguments.                      |
| `@runs [runs]`          | `// @runs 100`            | Sets a number of runs for a fuzz test. Default: `10`.                                  |

## Fuzz Testing

Fuzz testing injects **random**, **edge-case**, or **fixture-based** data into tests to uncover bugs and vulnerabilities.

### Fuzz Testing in Tolk

Fuzz is supported through annotation `@fuzz`, optionally with a TLB schema for `Args` type.

```kotlin
// @fuzz
// @runs 10
get test_fuzz_sum_of_numbers(a: int, b: int) s{
    assert(calculateSum(a, b) == a + b) throw 101;
}

// @fuzz _ a: uint8 b:# = Args;
get test_fuzz_with_tlb(a: int, b: int) {
    assert(calculateSum(a, b) == a + b) throw 102;
}
```

### Fuzz Testing with Fixtures

Fixtures are predefined data sets that are declared as get-methods with prefix `fixture_`. If they are defined, random values are selected from them.

```kotlin
get fixture_x() {
    return (6, 7, 8, 9, 10);
}

get fixture_y() {
    return (1, 2, 3, 4, 5);
}

// @fuzz
get test_fuzz_sum_of_numbers_with_fixtures(x: int, y: int) {
    assert(calculateSum(x, y) == x + y) throw 101;
}
```

### Supported Data Types

Currently, the following data types are supported:

- `int` - Integer fuzzing. Better use with TLB.
- `address` - Address fuzzing.
- `slice` - Slice fuzzing.

## License

<a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-green.svg" alt="License"></a>
