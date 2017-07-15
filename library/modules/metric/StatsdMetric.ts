/// <reference types="node" />
import * as assert from "assert";
import { IContainerModuleOpts, ContainerMetricMessage, EMetricType } from "../../container";
import { Metric } from "./Metric";

// Package statsd-client types are out of date.
const STATSD = require("statsd-client");

// TODO: Validation library.
export const ENV_STATSD_HOST = "STATSD_HOST";
export const ENV_STATSD_PORT = "STATSD_PORT";

export class StatsdMetric extends Metric {

  private _statsd: any;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get host and port environment values.
    const host = this.environment.get(ENV_STATSD_HOST);
    const port = this.environment.get(ENV_STATSD_PORT) || "8125";
    assert(host != null, "StatsD host is undefined");
    assert(port != null, "StatsD port is undefined");
    this.debug(`host:port '${host}:${port}'`);

    // Create statsd client instance.
    // TODO: Handle more client options.
    this._statsd = new STATSD({ host, port });
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
