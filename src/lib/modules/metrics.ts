import { ContainerMetricMessage, IModuleOptions, Module } from "../../container";

/** Abstract container metrics handler module. */
export abstract class Metrics extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "Metrics";

  public constructor(options: IModuleOptions) {
    super(options);

    // Subscribe to container metric messages.
    this.container.metrics$.subscribe((metric) => this.metricsOnMessage(metric));
  }

  /** Abstract handler for incoming metric messages. */
  protected abstract metricsOnMessage(metric: ContainerMetricMessage): void;
}
