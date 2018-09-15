# CHANGELOG

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
