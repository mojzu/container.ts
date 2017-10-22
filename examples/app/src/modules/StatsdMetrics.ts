import { ContainerMetricMessage, EMetricType, IModuleOpts } from "container.ts";
import { Metrics } from "container.ts/lib/node-modules";
import { Validate } from "container.ts/lib/validate";
import * as StatsdClient from "statsd-client";

export class StatsdMetrics extends Metrics {

  public static readonly NAME: string = "Statsd";

  /** Environment variable names. */
  public static ENV = {
    /** StatsD server host (required). */
    HOST: "STATSD_HOST",
    /** StatsD server port (default 8125). */
    PORT: "STATSD_PORT",
  };

  protected readonly statsd: any;

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Get host and port environment values.
    const host = Validate.isString(this.environment.get(StatsdMetrics.ENV.HOST));
    const port = Validate.isPort(this.environment.get(StatsdMetrics.ENV.PORT) || "8125");
    this.debug(`${StatsdMetrics.ENV.HOST}="${host}" ${StatsdMetrics.ENV.PORT}="${port}"`);

    // Create statsd client instance.
    this.statsd = new StatsdClient({ prefix: this.container.name, host, port });
  }

  /** StatsD handler for incoming metric messages. */
  protected handleMetric(metric: ContainerMetricMessage): void {
    // Map type to statsd methods.
    switch (metric.type) {
      case EMetricType.Increment: {
        this.statsd.increment(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Decrement: {
        this.statsd.decrement(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Gauge: {
        this.statsd.gauge(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Timing: {
        this.statsd.timing(metric.name, metric.value, metric.tags);
        break;
      }
      case EMetricType.Histogram: {
        this.statsd.histogram(metric.name, metric.value, metric.tags);
        break;
      }
    }
  }

}
