# Application

TypeScript application template.

## Developer

```Shell
# Install dependencies.
$ yarn install

# Run tasks defined in `gulpfile.js`.
$ yarn run clean|distclean|test|lint|docs|start|inspect|build

# Use production flag for release builds.
$ yarn run build -- -p
```

### Modules

Application functionality is split into interdependent modules, dependency injection is handled by the `Container` class.

#### Assets

Read only files packaged with application binary.

#### Process

Node.js process interface, reads `process.json` file asset to get package name and version.

#### Scripts

Node.js scripts packaged with application binary.

#### Log

Application log and error handling.

-   [Rollbar](https://rollbar.com/)
-   [winston](https://github.com/winstonjs/winston)

## Links

-   [Yarn](https://yarnpkg.com/en/docs/cli/)
-   [package.json](https://docs.npmjs.com/files/package.json)
-   [Gulp](http://gulpjs.com/)
-   [Jasmine](https://jasmine.github.io/)
-   [Istanbul](http://gotwarlost.github.io/istanbul/)
-   [TypeDoc](https://github.com/TypeStrong/typedoc)
-   [TSLint](https://palantir.github.io/tslint/)
-   [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
-   [webpack](https://webpack.js.org/configuration/)
-   [Babel](https://babeljs.io/)
-   [pkg](https://github.com/zeit/pkg)
