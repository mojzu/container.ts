import { ContainerMetricMessage, IModuleOpts, Module } from "../../container";

export abstract class Metrics extends Module {

  /** Default module name. */
  public static readonly NAME: string = "Metrics";

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Subscribe to container metric messages.
    this.container.metrics$
      .subscribe((metric) => this.handleMetric(metric));
  }

  protected abstract handleMetric(metric: ContainerMetricMessage): void;

}
