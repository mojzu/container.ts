// Workaround for `@types/jasmine/index.d.ts` is not a module error.
const jasmine_module = require("jasmine");
const jasmine_test = new jasmine_module();

// Run tests for `*.spec.js` files
jasmine_test.loadConfig({
    spec_dir: "dist",
    spec_files: [
        "**/*[sSpec].js"
    ],
});
jasmine_test.configureDefaultReporter({
    showColors: true
});
jasmine_test.execute();
