# Container.ts

Modular application framework library.

## Developer

Clone repository, install dependencies with `yarn install` and run scripts: `yarn run ...`

| Script      | Description                                           |
| ----------- | ----------------------------------------------------- |
| `clean`     | Clean compiled files.                                 |
| `distclean` | Remove Node modules and generated documentation.      |
| `test`      | Run tests using Jasmine and Istanbul.                 |
| `lint`      | Run TSLint on project.                                |
| `example`   | Run example script, `yarn run example -- -f schema`.  |
| `docs`      | Generate Typedoc documentation.                       |
| `build`     | Build library for release.                            |

Publishing library to NPM/GitHub.

```Shell
$ yarn run build && npm publish --access=public
$ git push origin master --tags
```

### References

-   [EditorConfig](http://editorconfig.org)
-   [gitignore](https://git-scm.com/docs/gitignore)
-   [Git Configuration](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)
-   [Gulp](http://gulpjs.com/)
-   [LICENCE](https://help.github.com/articles/licensing-a-repository/)
-   [package.json](https://docs.npmjs.com/files/package.json)
-   [README](https://help.github.com/articles/about-readmes/)
-   [Jasmine](https://jasmine.github.io/)
-   [Istanbul](http://gotwarlost.github.io/istanbul/)
-   [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
-   [TSLint](https://palantir.github.io/tslint/)
-   [Yarn](https://yarnpkg.com/en/docs/cli/)
-   [webpack](https://webpack.js.org/configuration/)
-   [pkg](https://github.com/zeit/pkg)

Set the Git commit message template.

```Shell
$ git config --global commit.template .gitmessage
```
