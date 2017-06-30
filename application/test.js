const Jasmine = require("jasmine");
const jasmine = new Jasmine();

// Run tests for `*.spec.js` files
jasmine.loadConfig({
  spec_dir: "dist",
  spec_files: [
    // Run all tests.
    "**/*[spec].js",

    // // Run tests by specifying file(s) here.
    // "main.spec.js",
  ],
});
jasmine.configureDefaultReporter({
  showColors: true,
});
jasmine.execute();
