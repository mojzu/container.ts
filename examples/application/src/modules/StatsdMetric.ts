import { ContainerMetricMessage, EMetricType } from "container.ts";
import { Validate } from "container.ts/lib/validate";
import { Metric } from "container.ts/modules";
import * as StatsdClient from "statsd-client";

export class StatsdMetric extends Metric {

  /** Environment variable names. */
  public static ENV = {
    /** StatsD server host (required). */
    HOST: "STATSD_HOST",
    /** StatsD server port (default 8125). */
    PORT: "STATSD_PORT",
  };

  private _statsd: any;

  public setup(): void {
    super.setup();

    // Get host and port environment values.
    const host = Validate.isString(this.environment.get(StatsdMetric.ENV.HOST));
    this.debug(`${StatsdMetric.ENV.HOST}="${host}"`);
    const port = Validate.isPort(this.environment.get(StatsdMetric.ENV.PORT) || "8125");
    this.debug(`${StatsdMetric.ENV.PORT}="${port}"`);

    // Create statsd client instance.
    this._statsd = new StatsdClient({ prefix: this.container.name, host, port });
  }

  /** StatsD handler for incoming metric messages. */
  protected handleMetric(metric: ContainerMetricMessage): void {
    // Map type to statsd methods.
    switch (metric.type) {
      case EMetricType.Increment: {
        this._statsd.increment(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Decrement: {
        this._statsd.decrement(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Gauge: {
        this._statsd.gauge(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Timing: {
        this._statsd.timing(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Histogram: {
        this._statsd.histogram(metric.name, metric.value, metric.tags);
        break;
      }
    }
  }

}
