# Application

## Developer

Clone repository, install dependencies with `yarn install` and run scripts: `yarn run ...`

| Script      | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `clean`     | Clean compiled files.                                         |
| `distclean` | Remove Node modules and generated documentation.              |
| `lint`      | Run TSLint on project.                                        |
| `start`     | Start application for development.                            |
| `build`     | Build application for release (optional `-p` production flag) |

## Vagrant

```Shell
$ vagrant up|ssh|halt|destroy
```

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
