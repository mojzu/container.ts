
/** Metric types supported by StatsD. */
export enum EMetricType {
  Timing,
}

/** Metric callback option type. */
export type IMetricCallback = (type: EMetricType, name: string, value?: any, options?: IMetricOptions) => void;

/** Metric send options. */
export interface IMetricOptions {
  sampleRate?: number;
  tags?: string[];
  callback?: IMetricCallback;
}

/** Abstract metric class. */
export abstract class Metric {

  /** Send time metric in milliseconds. */
  public timing(name: string, time: number, options?: IMetricOptions): void {
    return this.metric(EMetricType.Timing, name, time, options);
  }

  /** Metric method provided by implementor. */
  protected abstract metric(type: EMetricType, name: string, value?: any, options?: IMetricOptions): void;

}