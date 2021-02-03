# CHANGELOG

## 3.2.53 (2021-02-03)

### Changed

- Updated package dependencies.

---

## 3.2.52 (2021-01-03)

### Changed

- Updated package dependencies.

---

## 3.2.51 (2020-12-02)

### Changed

- Updated package dependencies.

---

## 3.2.50 (2020-10-02)

### Changed

- Updated package dependencies.

---

## 3.2.49 (2020-09-14)

### Changed

- Updated package dependencies.

---

## 3.2.48 (2020-09-02)

### Changed

- Updated package dependencies.

---

## 3.2.47 (2020-08-03)

### Changed

- Updated package dependencies.

---

## 3.2.46 (2020-07-02)

### Changed

- Updated package dependencies.

---

## 3.2.45 (2020-06-02)

### Changed

- Updated package dependencies.

---

## 3.2.44 (2020-05-04)

### Changed

- Updated package dependencies.

---

## 3.2.43 (2020-04-02)

### Changed

- Updated package dependencies.

---

## 3.2.42 (2020-02-23)

### Changed

- Updated package dependencies.

---

## 3.2.41 (2019-12-29)

### Changed

- Updated package dependencies.

---

## 3.2.31 (2019-11-19)

### Changed

- Downgrade TypeScript version for compatability.

---

## 3.2.30 (2019-11-19)

### Changed

- Updated package dependencies.

---

## 3.2.29 (2019-10-20)

### Changed

- Updated package dependencies.

---

## 3.2.28 (2019-10-05)

### Changed

- Updated package dependencies.

---

## 3.2.27 (2019-08-19)

### Changed

- Updated package dependencies.

---

## 3.2.26 (2019-08-04)

### Changed

- Updated package dependencies.

---

## 3.2.25 (2019-07-15)

### Changed

- Updated package dependencies.

---

## 3.2.24 (2019-07-02)

### Changed

- Updated package dependencies.

---

## 3.2.23 (2019-06-06)

### Changed

- Updated package dependencies.

### Fixed

- Replace `validator.toString` use with `lodash.toString` method.

---

## 3.2.22 (2019-05-16)

### Changed

- Updated package dependencies.

---

## 3.2.21 (2019-05-11)

### Changed

- Updated package dependencies.

---

## 3.2.20 (2019-04-27)

### Changed

- Updated package dependencies.
- Removed yarn in favour of npm.

---

## 3.2.19 (2019-03-24)

### Changed

- Updated package dependencies.

---

## 3.2.18 (2019-03-11)

### Changed

- Updated package dependencies.

---

## 3.2.17 (2019-02-18)

### Changed

- Updated package dependencies.

---

## 3.2.16 (2019-02-13)

### Changed

- Updated package dependencies.

---

## 3.2.15 (2019-02-09)

### Changed

- Updated package dependencies.

---

## 3.2.14 (2019-02-04)

### Changed

- Updated package dependencies.

---

## 3.2.13 (2019-02-01)

### Changed

- Updated package dependencies.

---

## 3.2.12 (2019-01-23)

### Changed

- Updated package dependencies.

---

## 3.2.11 (2019-01-19)

### Changed

- Added `moduleName` to context of module registered container error.
- Updated package dependencies.

---

## 3.2.10 (2019-01-12)

### Changed

- Updated package dependencies.

---

## 3.2.9 (2019-01-01)

### Changed

- Updated package dependencies.

---

## 3.2.8 (2018-12-23)

### Changed

- Updated package dependencies.

---

## 3.2.7 (2018-12-09)

### Changed

- Updated package dependencies.

---

## 3.2.6 (2018-12-02)

### Changed

- Updated package dependencies.

---

## 3.2.5 (2018-11-27)

### Added

- Added `RxModule.rxStateUpdate` method.

### Changed

- Updated package dependencies.

---

## 3.2.4 (2018-11-24)

### Changed

- Updated package dependencies.

---

## 3.2.3 (2018-11-18)

### Changed

- Updated package dependencies.

---

## 3.2.2 (2018-11-13)

### Changed

- Updated package dependencies.

---

## 3.2.1 (2018-11-06)

### Changed

- Updated package dependencies.

---

## 3.2.0 (2018-11-04)

### Changed

- Changed `IContainerArguments` interface to be more generic.
- Updated package dependencies.

---

## 3.1.4 (2018-10-25)

### Changed

- Updated package dependencies.

---

## 3.1.3 (2018-10-10)

### Changed

- Updated package dependencies.

---

## 3.1.2 (2018-10-01)

### Changed

- Updated package dependencies.

---

## 3.1.1 (2018-09-26)

### Changed

- Updated package dependencies.

---

## 3.1.0 (2018-09-15)

### Added

- Added `Process.kill` method.
- Added state behaviour subject and `rxState$` property to `RxModule`.

### Changed

- `ErrorChain.serialise` includes plain objects in output as checked by `lodash.isPlainObject`.
- `ErrorChain.messageConstructor` serialises data into JSON string for display (plain objects only).
- All error codes enums now have string values.
- Replace internal uses of module debug with log calls.
- Updated package dependencies.

---

## 3.0.3 (2018-09-03)

### Changed

- Updated package dependencies.

---

## 3.0.2 (2018-08-30)

### Changed

- Updated package dependencies.

---

## 3.0.1 (2018-08-27)

### Changed

- Updated package dependencies.

---

## 3.0.0 (2018-08-19)

### Changed

- `Container` class `up`, `down` methods now return promises instead of observables.
- Rewrote `Module` class hooks, all signatures now based on `moduleDependencies` method, rewrite all `moduleUp`, `moduleDown` and `moduleDestroy` hooks.
- Updated container and application examples.

---

## 2.2.0 (2018-08-11)

### Added

- Add `RxModule` class, has internal unsubscribe subject and `takeUntilDown` method.

### Changed

- Refactor `Scripts` module to use `RxModule` base class, inheritors must call `super.moduleDown` and `super.moduleDestroy` methods in their module hooks.
- Inheritors of `ErrorChain` have more consistent constructors, error codes.
- Updated package dependencies.

---

## 2.1.3 (2018-08-07)

### Changed

- Updated package dependencies.

---

## 2.1.2 (2018-07-31)

### Changed

- Updated package dependencies.

---

## 2.1.1 (2018-07-30)

### Changed

- Updated package dependencies.

---

## 2.1.0 (2018-07-29)

### Added

- Added `extend` as static method on `Schema` class, helps with exporting schemas via a library.

---

## 2.0.11 (2018-07-28)

### Fixed

- Reduce usage of `instanceof` for class instance detection, use instance properties as secondary test.

---

## 2.0.10 (2018-07-28)

### Changed

- Updated package dependencies.

---

## 2.0.9 (2018-07-27)

### Changed

- Updated package dependencies.

---

## 2.0.8 (2018-07-13)

### Added

- Add `has` method to `Environment` class.

---

## 2.0.7 (2018-07-10)

### Fixed

- Fix `isDirectory` does not returned resolved path to directory.

---

## 2.0.6 (2018-07-09)

### Added

- `Environment` class instance `get` method throws error if value is undefined and no default value is provided.

### Changed

- Update documentation link in `README.md`
