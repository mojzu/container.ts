import { ContainerModule, ContainerMetricMessage } from "../container";

export abstract class Metric extends ContainerModule {

  public setup(): void {
    super.setup();

    // Subscribe to container metric messages.
    this.container.metrics
      .subscribe((metric) => this.handleMetric(metric));
  }

  protected abstract handleMetric(metric: ContainerMetricMessage): void;

}
