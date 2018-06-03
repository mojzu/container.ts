import { DateTimeOptions, Interval } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isInterval options. */
export interface IIsInterval extends DateTimeOptions {}

/** Validate that value is a valid date time interval parsed by 'luxon' library. */
export function isInterval(value = "", options: IIsInterval = {}): Interval {
  let interval: Interval;

  try {
    interval = Interval.fromISO(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidInterval, value, error);
  }

  if (!interval.isValid) {
    throw new ValidateError(EValidateError.InvalidInterval, value);
  }
  return interval;
}

export class IntervalField extends Field<Interval> {
  public constructor(protected readonly options: IIsInterval = {}) {
    super();
  }
  public validate(value: string): Interval {
    return isInterval(value, this.options);
  }
  public format(value: Interval): string {
    return value.toISO();
  }
}
