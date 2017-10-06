# Container.ts

[![npm](https://img.shields.io/npm/v/container.ts.svg?style=flat-square)](https://www.npmjs.com/package/container.ts)
[![npm](https://img.shields.io/npm/l/container.ts.svg?style=flat-square)](https://github.com/mojzunet/container.ts/blob/master/LICENCE)
[![Travis CI](https://img.shields.io/travis/mojzunet/container.ts.svg?style=flat-square)](https://travis-ci.org/mojzunet/container.ts)
[![Code Climate](https://img.shields.io/codeclimate/coverage/github/mojzunet/container.ts.svg?style=flat-square)](https://codeclimate.com/github/mojzunet/container.ts)

Modular application framework library.

## Dependencies

-   [debug](https://www.npmjs.com/package/debug)
-   [awilix](https://www.npmjs.com/package/awilix)
-   [rxjs](https://www.npmjs.com/package/rxjs)
-   [validator](https://www.npmjs.com/package/validator)
-   [moment-timezone](https://www.npmjs.com/package/moment-timezone)

## Developer

Clone repository, install dependencies with `yarn install` and run scripts: `yarn run ...`

| Script      | Description                                       |
| ----------- | ------------------------------------------------- |
| `clean`     | Clean compiled files.                             |
| `distclean` | Remove Node modules.                              |
| `test`      | Run tests using Jasmine and Istanbul.             |
| `lint`      | Run TSLint on project.                            |
| `example`   | Run example script, `yarn run example -f schema`. |
| `dist`      | Build library for release.                        |

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
-   [Jasmine](https://jasmine.github.io/)
-   [Istanbul](http://gotwarlost.github.io/istanbul/)
-   [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
-   [TSLint](https://palantir.github.io/tslint/)
-   [Yarn](https://yarnpkg.com/en/docs/cli/)
-   [pkg](https://github.com/zeit/pkg)
-   [Neon](https://github.com/neon-bindings/neon)
-   [Rollbar](https://rollbar.com/)
-   [winston](https://github.com/winstonjs/winston)
-   [Airbrake](https://airbrake.io/)
-   [Loggly](https://www.loggly.com/)
-   [Telegraf](https://www.influxdata.com/time-series-platform/telegraf/)
-   [Datadog](https://www.datadoghq.com/)

Set the Git commit message template.

```Shell
$ git config --global commit.template .gitmessage
```
