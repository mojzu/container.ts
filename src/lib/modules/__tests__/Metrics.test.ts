import { Container, ContainerMetricMessage } from "../../../container";
import { Metrics } from "../Metrics";

class TestMetrics extends Metrics {
  public static readonly moduleName: string = "TestMetrics";
  protected onMessage(metric: ContainerMetricMessage): void {
    // TODO(MEDIUM): Add Container metrics tests.
  }
}

describe("Metric", () => {

  const NAME = "Test";
  const CONTAINER = new Container(NAME)
    .registerModule(TestMetrics);

  const METRICS = CONTAINER.resolve<TestMetrics>(TestMetrics.name);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
  });

  it("#TestMetrics", () => {
    expect(METRICS).toBeDefined();
    expect(METRICS.moduleName).toEqual(TestMetrics.moduleName);
  });

});
