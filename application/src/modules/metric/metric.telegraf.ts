import * as assert from "assert";
import * as constants from "../../constants";
import { IContainerModuleOpts, ContainerMetricMessage, EMetricType } from "../../container";
import { Metric } from "./metric";

// Package hot-shots does not have defined types.
const StatsD: any = require("hot-shots");

export class TelegrafMetric extends Metric {

  private _statsd: any;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get host and port environment values.
    const host = this.environment.get(constants.ENV_TELEGRAF_HOST);
    const port = this.environment.get(constants.ENV_TELEGRAF_PORT);
    assert(host != null, "Telegraf host is undefined");
    assert(port != null, "Telegraf port is undefined");
    this.debug(`host:port '${host}:${port}'`);

    // Create statsd client instance.
    // Use telegraf line protocol.
    // TODO: Handle more client options.
    this._statsd = new StatsD({
      host,
      port,
      telegraf: true,
      errorHandler: this.handleError.bind(this),
    });
  }

  /** Telegraf handler for incoming metric messages. */
  protected handleMetric(metric: ContainerMetricMessage): void {
    const callback = this.handleError.bind(this);
    const args = this.telegrafArgs(metric);

    // Map type to statsd methods.
    switch (metric.type) {
      case EMetricType.Timing: {
        this._statsd.timing(...args, callback);
        break;
      }
    }
  }

  /** Telegraf error handler callback. */
  protected handleError(error?: any): void {
    if (error != null) {
      process.stderr.write(String(error));
    }
  }

  /** Map metric message properties to argument array. */
  protected telegrafArgs(metric: ContainerMetricMessage): any[] {
    const args: any[] = [metric.name];

    if (metric.value != null) {
      args.push(metric.value);
    }
    if (metric.options.sampleRate != null) {
      args.push(metric.options.sampleRate);
    }
    if (metric.options.tags != null) {
      args.push(metric.options.tags);
    }

    return args;
  }

}
