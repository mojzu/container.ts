# Modules

Application functionality is split into interdependent modules, dependency injection is handled by the `Container` class.

#### Asset

Read only files packaged with application binary.

#### Process

Node.js process interface, reads `process.json` file asset to get package name and version. A `ChildProcess` module is also included for use with `Script` module, to support interprocess communication and forwarding logs and metrics to parent process.

#### Script

Node.js scripts packaged with application binary.

-   TODO: Support for [Neon](https://github.com/neon-bindings/neon) with `NeonScript`?

#### Log

Application log and error reporting.

-   [Rollbar](https://rollbar.com/)
-   [winston](https://github.com/winstonjs/winston)
-   [Airbrake](https://airbrake.io/)
-   [Loggly](https://www.loggly.com/)

#### Metric

Application status and metric reporting.

-   [Telegraf](https://www.influxdata.com/time-series-platform/telegraf/)
-   [Datadog](https://www.datadoghq.com/)
-   [Graphite](https://graphiteapp.org/)
