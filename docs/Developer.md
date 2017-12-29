# Developer

TODO(H): Update this.

Clone repository, install dependencies with `yarn install` and run scripts: `yarn run ...`

| Script      | Description                                    |
| ----------- | ---------------------------------------------- |
| `clean`     | Clean compiled files.                          |
| `distclean` | Remove Node modules.                           |
| `lint`      | Run TSLint on project.                         |
| `test`      | Run tests using Jest.                          |
| `example`   | Run example script, `yarn run example schema`. |
| `dist`      | Build library for release.                     |

Publishing library to NPM/GitHub.

```Shell
$ yarn run dist && npm publish --access=public
$ git push origin master --tags
```

Add [Code Climate](https://codeclimate.com/) repository token to [Travis CI](https://travis-ci.org/) in `Settings -> Environment Variables`.

### Links

-   [EditorConfig](http://editorconfig.org)
-   [gitignore](https://git-scm.com/docs/gitignore)
-   [Git Configuration](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)
-   [Travis CI](https://travis-ci.org/)
-   [FuseBox](http://fuse-box.org/)
-   [LICENCE](https://help.github.com/articles/licensing-a-repository/)
-   [package.json](https://docs.npmjs.com/files/package.json)
-   [README](https://help.github.com/articles/about-readmes/)
-   [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
-   [TSLint](https://palantir.github.io/tslint/)
-   [Yarn](https://yarnpkg.com/en/docs/cli/)
-   [Jest](https://facebook.github.io/jest/)

Set the Git commit message template.

```Shell
$ git config --global commit.template .gitmessage
```

-   [pkg](https://github.com/zeit/pkg)
-   [Neon](https://github.com/neon-bindings/neon)
-   [Rollbar](https://rollbar.com/)
-   [winston](https://github.com/winstonjs/winston)
-   [Airbrake](https://airbrake.io/)
-   [Loggly](https://www.loggly.com/)
-   [Telegraf](https://www.influxdata.com/time-series-platform/telegraf/)
-   [Datadog](https://www.datadoghq.com/)
