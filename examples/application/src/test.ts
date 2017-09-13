/// <reference types="node" />
const JASMINE = require("jasmine");
const SPECS = new JASMINE();

// Run tests for compiled `*.spec.js` files
SPECS.loadConfig({
  spec_dir: "dist",
  spec_files: ["**/*[spec].js"],
});
SPECS.configureDefaultReporter({ showColors: true });
SPECS.execute();
