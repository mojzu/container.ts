import { Container, ContainerMetricMessage, EMetricType } from "../../../container";
import { Metrics } from "../Metrics";

type ITestMetricsCallback = (metric: ContainerMetricMessage) => void;

class TestMetrics extends Metrics {
  public static readonly moduleName: string = "TestMetrics";
  protected metricsOnMessage(metric: ContainerMetricMessage): void {
    const callback: ITestMetricsCallback = metric.args[0];
    if (callback != null) {
      callback(metric);
    }
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
    CONTAINER.destroy();
  });

  it("#TestMetrics", () => {
    expect(METRICS).toBeDefined();
    expect(METRICS.moduleName).toEqual(TestMetrics.moduleName);
  });

  it("#TestMetric#increment", (done) => {
    const name = "testCounter";
    const value = 5;
    const tags = { tag: "tag" };
    METRICS.metric.increment(name, value, tags, (metric: ContainerMetricMessage) => {
      expect(metric.type).toEqual(EMetricType.Increment);
      expect(metric.name).toEqual(name);
      expect(metric.value).toEqual(value);
      expect(metric.tags).toEqual(tags);
      expect(metric.tags.moduleName).toEqual(`${NAME}.${TestMetrics.moduleName}`);
      done();
    });
  });

});
