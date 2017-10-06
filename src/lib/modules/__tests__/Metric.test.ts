import { Container, ContainerMetricMessage } from "../../../container";
import { Metric } from "../Metric";

class TestMetric extends Metric {
  public static readonly NAME: string = "TestMetric";
  protected handleMetric(metric: ContainerMetricMessage): void {
    // TODO: Test this.
  }
}

describe("Metric", () => {

  const NAME = "Test";
  const CONTAINER = new Container(NAME)
    .registerModule(TestMetric.NAME, TestMetric);

  const METRIC = CONTAINER.resolve<TestMetric>(TestMetric.name);

  beforeAll((done) => {
    CONTAINER.start()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  afterAll((done) => {
    CONTAINER.stop()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  it("#TestMetric", () => {
    expect(METRIC).toBeDefined();
    expect(METRIC.name).toEqual(TestMetric.NAME);
  });

});
