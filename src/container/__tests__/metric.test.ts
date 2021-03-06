import { EMetricType, IMetricTags, Metric } from "../metric";

let _CALLBACK: any = null;

function setCallback(callback: any): void {
  _CALLBACK = (...args: any[]) => {
    callback(...args);
    _CALLBACK = null;
  };
}

function tryCallback(...args: any[]): void {
  if (_CALLBACK != null) {
    _CALLBACK(...args);
  }
}

class TestMetric extends Metric {
  protected metric(type: EMetricType, name: string, value: any = null, tags: IMetricTags = {}): void {
    tryCallback(type, name, value, tags);
  }
}

describe("Metric", () => {
  const METRIC = new TestMetric();

  it("increment type message", (done) => {
    setCallback((type: EMetricType, name: string, value: any, tags: IMetricTags) => {
      expect(type).toEqual(EMetricType.Increment);
      expect(name).toEqual("increment");
      expect(value).toEqual(1);
      expect(tags).toBeDefined();
      done();
    });
    METRIC.increment("increment");
  });

  it("decrement type message", (done) => {
    setCallback((type: EMetricType, name: string, value: any, tags: IMetricTags) => {
      expect(type).toEqual(EMetricType.Decrement);
      expect(name).toEqual("decrement");
      expect(value).toEqual(-1);
      expect(tags).toBeDefined();
      done();
    });
    METRIC.decrement("decrement");
  });

  it("gauge type message", (done) => {
    setCallback((type: EMetricType, name: string, value: any, tags: IMetricTags) => {
      expect(type).toEqual(EMetricType.Gauge);
      expect(name).toEqual("gauge");
      expect(value).toEqual(100);
      expect(tags).toBeDefined();
      done();
    });
    METRIC.gauge("gauge", 100);
  });

  it("timing type message", (done) => {
    setCallback((type: EMetricType, name: string, value: any, tags: IMetricTags) => {
      expect(type).toEqual(EMetricType.Timing);
      expect(name).toEqual("timing");
      expect(value).toEqual(1000);
      expect(tags).toBeDefined();
      done();
    });
    METRIC.timing("timing", 1000);
  });

  it("histogram type message", (done) => {
    setCallback((type: EMetricType, name: string, value: any, tags: IMetricTags) => {
      expect(type).toEqual(EMetricType.Histogram);
      expect(name).toEqual("histogram");
      expect(value).toEqual(100);
      expect(tags).toBeDefined();
      done();
    });
    METRIC.histogram("histogram", 100);
  });
});
