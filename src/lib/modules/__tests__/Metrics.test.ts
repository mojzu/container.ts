import { Container, ContainerMetricMessage } from "../../../container";
import { Metrics } from "../Metrics";

class TestMetrics extends Metrics {
  public static readonly NAME: string = "TestMetrics";
  protected handleMetric(metric: ContainerMetricMessage): void {
    // TODO: Test this.
  }
}

describe("Metric", () => {

  const NAME = "Test";
  const CONTAINER = new Container(NAME)
    .registerModule(TestMetrics.NAME, TestMetrics);

  const METRICS = CONTAINER.resolve<TestMetrics>(TestMetrics.name);

  beforeAll(async () => {
    await CONTAINER.start().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.stop().toPromise();
  });

  it("#TestMetrics", () => {
    expect(METRICS).toBeDefined();
    expect(METRICS.name).toEqual(TestMetrics.NAME);
  });

});
