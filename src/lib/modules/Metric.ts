import { ContainerMetricMessage, ContainerModule, IContainerModuleOpts } from "../../container";

export abstract class Metric extends ContainerModule {

  /** Default module name. */
  public static readonly NAME: string = "Metric";

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Subscribe to container metric messages.
    this.container.metrics
      .subscribe((metric) => this.handleMetric(metric));
  }

  protected abstract handleMetric(metric: ContainerMetricMessage): void;

}
