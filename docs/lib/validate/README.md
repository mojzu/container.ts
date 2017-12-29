# Validate

TODO(H): Update this, split into files.

Input validation, wrapper for [validator](https://www.npmjs.com/package/validator) library. Split into `container.ts/lib/validate` and `container.ts/lib/node-validate`.

Methods in `node-modules` depend on Node.js APIs.

```TypeScript
import { Validate } from "container.ts/lib/validate";
import { NodeValidate } from "container.ts/lib/node-validate";

// All validation methods are static methods on Validate class.
// Methods may have optional validation options.
const bool = Validate.isBoolean("1", { strict: false });
const int = Validate.isInteger("5", { min: 0 });

// Instances of ValidateError are thrown if validation fails.
try {
  Validate.isFloat("foo");
} catch (error) {
  // ...
}

// Validate methods.
// isBoolean
// isInteger
// isFloat
// isHexadecimal
// isString
// isAscii
// isBase64
// isPort
// isLanguage
// isCountry
// isLocale
// isTimeZone
// isDate
// isDuration
// isIp
// isDomain
// isUrl
// isEmail
// isMongoId
// isHexColour

// NodeValidate adds Node.js specific validators.
const fileExists = NodeValidate.isFile("/path/to/file");

// NodeValidate methods.
// isBuffer
// isFile
// isDirectory
```
