
/** Metric types supported by StatsD. */
export enum EMetricType {
  Increment,
  Decrement,
  Gauge,
  Timing,
  Histogram,
}

/** Metric tags. */
export interface IMetricTags extends Object {
  [key: string]: any;
}

/** Abstract metric class. */
export abstract class Metric {

  /** Send i counter metric. */
  public increment(name: string, value = 1, tags: IMetricTags = {}): void {
    return this.metric(EMetricType.Increment, name, value, tags);
  }

  /** Send decrement counter metric. */
  public decrement(name: string, value = -1, tags: IMetricTags = {}): void {
    return this.metric(EMetricType.Decrement, name, value, tags);
  }

  /** Send value metric. */
  public gauge(name: string, value: number, tags: IMetricTags = {}): void {
    return this.metric(EMetricType.Gauge, name, value, tags);
  }

  /** Send time metric in milliseconds. */
  public timing(name: string, value: number | Date, tags: IMetricTags = {}): void {
    return this.metric(EMetricType.Timing, name, value, tags);
  }

  /** Send distribution value metric. */
  public histogram(name: string, value: number, tags: IMetricTags = {}): void {
    return this.metric(EMetricType.Histogram, name, value, tags);
  }

  /** Metric method provided by implementor. */
  protected abstract metric(type: EMetricType, name: string, value: any, tags: IMetricTags): void;

}
