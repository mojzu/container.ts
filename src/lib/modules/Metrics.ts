import { ContainerMetricMessage, IModuleOpts, Module } from "../../container";

export abstract class Metrics extends Module {

  /** Default module name. */
  public static readonly moduleName: string = "Metrics";

  public constructor(opts: IModuleOpts) {
    super(opts);

    // Subscribe to container metric messages.
    this.container.metrics$
      .subscribe((metric) => this.onMessage(metric));
  }

  /** Abstract handler for incoming metric messages. */
  protected abstract onMessage(metric: ContainerMetricMessage): void;

}
