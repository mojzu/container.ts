# Node Application

```Shell
$ yarn install
```

## Notes

-   `src/main.ts` - Application entry point.
-   `src/test.ts` - Test runner using [Jasmine](https://jasmine.github.io/) and [Istanbul](http://gotwarlost.github.io/istanbul/).
-   `.editorconfig` - <http://editorconfig.org>
-   `.gitignore` - <http://help.github.com/ignore-files/>
-   `.gitmessage` - <https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration>
-   `package.json` - <https://docs.npmjs.com/files/package.json>
-   `tsconfig.json` - <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>
-   `tslint.json` - <https://palantir.github.io/tslint/>
-   `webpack.config.js` - <https://webpack.github.io/docs/configuration.html>
-   `yarn.lock` - <https://yarnpkg.com/en/docs/cli/>

Package scripts (`npm|yarn run [name]`).

-   `debug` - Run with debugger.
-   `inspect` - Run with Chrome V8 inspector.
-   `test` - Run tests.
-   `coverage` - Run tests with coverage reporting.
-   `lint` - Run linter against source code.
-   `webpack` - Bundle modules, run with `-p` flag for production build.

To set the Git commit message template.

```Shell
$ git config --global commit.template .gitmessage
$ git commit
```
