# Modules

Application functionality is split into interdependent modules, dependency injection is handled by the `Container` class.

#### Assets

Read only files packaged with application binary.

#### Process

Node.js process interface, reads `process.json` file asset to get package name and version. A `ChildProcess` module is also included for use by scripts, to support interprocess communication and forwarding logs and metrics to parent process.

#### Scripts

Node.js scripts packaged with application binary.

#### Log

Application log and error reporting.

-   [Rollbar](https://rollbar.com/)
-   [Airbrake](https://airbrake.io/)
-   [winston](https://github.com/winstonjs/winston)

#### Metric

Application status and metric reporting.

-   [hot-shots](https://github.com/brightcove/hot-shots)
-   [Datadog](https://www.datadoghq.com/)
-   [Telegraf](https://www.influxdata.com/time-series-platform/telegraf/)
-   [Graphite](https://graphiteapp.org/)
