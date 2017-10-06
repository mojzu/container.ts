/// <reference types="node" />
const JASMINE = require("jasmine");
const SPECS = new JASMINE();

// Run tests for compiled `*.spec.js` files
SPECS.loadConfig({
  spec_files: [
    "container/**/*[spec].js",
    "lib/**/*[spec].js",
  ],
});
SPECS.configureDefaultReporter({ showColors: true });
SPECS.execute();
