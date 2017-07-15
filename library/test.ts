/// <reference types="node" />
const Jasmine = require("jasmine");
const specs = new Jasmine();

// Run tests for compiled `*.spec.js` files
specs.loadConfig({ spec_files: ["**/*[spec].js"] });
specs.configureDefaultReporter({ showColors: true });
specs.execute();
