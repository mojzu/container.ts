# Vagrant

## Telegraf, InfluxDB, Chronograf

-   <https://docs.influxdata.com/telegraf/v1.3/>
-   <https://docs.influxdata.com/influxdb/v1.2/>
-   <https://docs.influxdata.com/chronograf/v1.3/>

Virtual machine for metrics collection.

-   Telegraf StatsD server listens on port `8125`.
-   Chronograf user interface available on port `8888`.

```Shell
$ sudo systemctl restart influxdb telegraf chronograf
$ journalctl -f -u influxdb -u telegraf -u chronograf
```
