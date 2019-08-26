# Developer

Clone repository, install dependencies with `npm install` and run scripts: `npm run ...`

| Script      | Description                                   |
| ----------- | --------------------------------------------- |
| `clean`     | Clean compiled files.                         |
| `distclean` | Remove Node modules.                          |
| `lint`      | Run TSLint on project.                        |
| `test`      | Run tests using Jest.                         |
| `example`   | Run example script, `npm run example schema`. |
| `dist`      | Build library for release.                    |

Update package dependencies.

```Shell
$ sudo npm install -g npm-check-updates
$ ncu --upgrade
$ npm install
```

Publish library to NPM and GitHub.

```Shell
$ npm run dist && npm publish --access=public [--tag=beta]
$ git push origin master --tags
```

## Links

- [EditorConfig](http://editorconfig.org)
- [gitignore](https://git-scm.com/docs/gitignore)
- [Git Configuration](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)
- [Travis CI](https://travis-ci.org/)
- [FuseBox](http://fuse-box.org/)
- [LICENCE](https://help.github.com/articles/licensing-a-repository/)
- [package.json](https://docs.npmjs.com/files/package.json)
- [README](https://help.github.com/articles/about-readmes/)
- [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [TSLint](https://palantir.github.io/tslint/)
- [Jest](https://facebook.github.io/jest/)
