import { Duration, DurationOptions } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isDuration options. */
export interface IIsDuration extends DurationOptions {}

/** Validate that value is a valid duration parsed by 'luxon' library. */
export function isDuration(value = "", options: IIsDuration = {}): Duration {
  try {
    const duration = Duration.fromISO(value, options);
    if (duration.isValid !== true) {
      throw new ValidateError(EValidateError.IsDurationError, value);
    }
    return duration;
  } catch (error) {
    throw new ValidateError(EValidateError.IsDurationError, value, error);
  }
}

export class DurationField extends Field<Duration> {
  public constructor(protected readonly options: IIsDuration = {}) {
    super();
  }
  public validate(value: string): Duration {
    return isDuration(value, this.options);
  }
  public format(value: Duration): string | null {
    return value.toISO();
  }
}
