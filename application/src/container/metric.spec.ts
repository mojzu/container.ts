/// <reference types="jasmine" />
import { EMetricType, IMetricOptions, Metric } from "./metric";

class TestMetric extends Metric {
  protected metric(type: EMetricType, name: string, value: any = null, options: IMetricOptions = {}): void {
    if (options.callback != null) {
      options.callback(type, name, value, options);
    }
  }
}

describe("Metric", () => {

  const METRIC = new TestMetric();

  it("#Metric#timing", (done) => {
    METRIC.timing("timing", 1000, {
      callback: (type, name, value, options) => {
        expect(type).toEqual(EMetricType.Timing);
        expect(name).toEqual("timing");
        expect(value).toEqual(1000);
        expect(options).toBeDefined();
        done();
      },
    });
  });

});
