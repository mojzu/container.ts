import {
  IContainerModuleOpts,
  IContainerModuleDepends,
  ContainerModule,
  ContainerMetricMessage,
} from "../../container";

export abstract class Metric extends ContainerModule {

  public constructor(name: string, opts: IContainerModuleOpts, depends?: IContainerModuleDepends) {
    super(name, opts, depends);

    // Subscribe to container metric messages.
    this.container.metrics
      .subscribe((metric) => this.handleMetric(metric));
  }

  protected abstract handleMetric(metric: ContainerMetricMessage): void;

}
