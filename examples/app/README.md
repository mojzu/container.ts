# Application

Example application.

## Developer

Clone repository, install dependencies with `yarn install` and run scripts: `yarn run ...`

| Script        | Description                           |
| ------------- | ------------------------------------- |
| `clean`       | Clean compiled files.                 |
| `distclean`   | Clean compiled files and Node modules |
| `lint`        | Lint package.                         |
| `test`        | Test package with coverage.           |
| `start`       | Start application for development.    |
| `dist`        | Build application for release.        |

| Flag                 | Description               |
| -------------------- | ------------------------- |
| `-n`, `--name`       | Package name override.    |
| `-v`, `--version`    | Package version override. |
| `-p`, `--production` | Production flag.          |

## Vagrant

| Command | Description |
| ------- | ------------------------------------ |
| up      | Start and provision virtual machine. |
| ssh     | Log into virtual machine via SSH.    |
| halt    | Stop virtual machine.                |
| destroy | Destroy virtual machine.             |

### Telegraf, InfluxDB, Chronograf

-   <https://docs.influxdata.com/telegraf/v1.4/>
-   <https://docs.influxdata.com/influxdb/v1.3/>
-   <https://docs.influxdata.com/chronograf/v1.3/>

Virtual machine for metrics collection.

-   Telegraf StatsD server listens on port `8125`.
-   Chronograf user interface available on port `8888`.

```Shell
$ sudo systemctl restart influxdb telegraf chronograf
$ journalctl -f -u influxdb -u telegraf -u chronograf
```
