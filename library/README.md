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
