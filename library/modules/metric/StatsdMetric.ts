/// <reference types="node" />
import { IContainerModuleOpts, ContainerMetricMessage, EMetricType } from "../../container";
import { Validate } from "../../lib/validate";
import { Metric } from "./Metric";

// Package statsd-client types are out of date.
const STATSD = require("statsd-client");

/** Environment variable name for StatsD server host (required). */
export const ENV_STATSD_HOST = "STATSD_HOST";

/** Environment variable name for StatsD server port (default 8125). */
export const ENV_STATSD_PORT = "STATSD_PORT";

export class StatsdMetric extends Metric {

  private _statsd: any;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get host and port environment values.
    const host = Validate.isString(this.environment.get(ENV_STATSD_HOST));
    this.debug(`${ENV_STATSD_HOST}="${host}"`);
    const port = Validate.isPort(this.environment.get(ENV_STATSD_PORT) || "8125");
    this.debug(`${ENV_STATSD_PORT}="${port}"`);

    // Create statsd client instance.
    // TODO: Handle more StatsD client options.
    this._statsd = new STATSD({
      prefix: this.container.name,
      host,
      port,
    });
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
