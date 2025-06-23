# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- Annotation `@exitCode` (use `test.expectExitCode()` instead)
- Annotation `@balance` (use `test.setOriginalBalance()` instead)
- Annotation `@unixTime` (use `test.setTime()` instead)
- Annotation `@test`

### Changed

- Default gas limit is increased to `2^62`.

### Added

- Fuzzing support (based on #3, thanks @KStasi)
- Assertions and helpers for testings (file `testing.tolk`)
