import { ContainerMetricMessage, EMetricType, IModuleOptions } from "container.ts";
import { Metrics } from "container.ts/lib/node/modules";
import { isPort, isString } from "container.ts/lib/validate";
import * as StatsdClient from "statsd-client";

export enum EStatsdMetricsEnv {
  /** StatsD server host (required). */
  Host = "STATSD_HOST",
  /** StatsD server port (default 8125). */
  Port = "STATSD_PORT"
}

export class StatsdMetrics extends Metrics {
  public static readonly moduleName: string = "Statsd";

  protected readonly statsd: any;

  public constructor(options: IModuleOptions) {
    super(options);

    // Get host and port environment values.
    const host = isString(this.environment.get(EStatsdMetricsEnv.Host));
    const port = isPort(this.environment.get(EStatsdMetricsEnv.Port, "8125"));
    this.debug(`${EStatsdMetricsEnv.Host}="${host}" ${EStatsdMetricsEnv.Port}="${port}"`);

    // Create statsd client instance.
    this.statsd = new StatsdClient({ prefix: this.container.name, host, port });
  }

  /** StatsD handler for incoming metric messages. */
  protected metricsOnMessage(metric: ContainerMetricMessage): void {
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
