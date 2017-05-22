# TypeScript Application Template

```Shell
# Install dependencies.
$ yarn install
# Clean distribution directory.
$ yarn run clean
# Start application.
$ yarn run start
# Start application with Chrome V8 inspector.
$ yarn run inspect
# Run tests (with coverage).
$ yarn run test|coverage
# Run linter.
$ yarn run lint
# Package application.
$ yarn run release
```

## Notes

-   `src/main.ts` - Application entry point.
-   `src/test.ts` - Test runner using [Jasmine](https://jasmine.github.io/) and [Istanbul](http://gotwarlost.github.io/istanbul/).
-   `.editorconfig` - <http://editorconfig.org>
-   `.gitignore` - <https://help.github.com/articles/ignoring-files/>
-   `.gitmessage` - <https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration>
-   `LICENCE` - <https://help.github.com/articles/licensing-a-repository/>
-   `package.json` - <https://docs.npmjs.com/files/package.json>
-   `README.md` - <https://help.github.com/articles/about-readmes/>
-   `tsconfig.json` - <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>
-   `tslint.json` - <https://palantir.github.io/tslint/>
-   `webpack.config.js` - <https://webpack.github.io/docs/configuration.html>
-   `yarn.lock` - <https://yarnpkg.com/en/docs/cli/>

To set the Git commit message template.

```Shell
$ git config --global commit.template .gitmessage
$ git commit
```
