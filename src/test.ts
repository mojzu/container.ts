// Workaround for `@types/jasmine/index.d.ts` is not a module error.
const Jasmine = require("jasmine");
const jasmineTest = new Jasmine();

// Run tests for `*.spec.js` files
jasmineTest.loadConfig({
  spec_dir: "dist",
  spec_files: [
    // // Run individual tests by specifying file paths here.
    // "**/*.spec.ts",

    // Run all tests.
    "**/*[sSpec].js",
  ],
});
jasmineTest.configureDefaultReporter({
  showColors: true,
});
jasmineTest.execute();
