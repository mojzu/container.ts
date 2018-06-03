import { Duration, DurationOptions } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isDuration options. */
export interface IIsDuration extends DurationOptions {}

/** Validate that value is a valid duration parsed by 'luxon' library. */
export function isDuration(value = "", options: IIsDuration = {}): Duration {
  let duration: Duration;

  try {
    duration = Duration.fromISO(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsDurationError, value, error);
  }

  if (!duration.isValid) {
    throw new ValidateError(EValidateError.IsDurationError, value);
  }
  return duration;
}

export class DurationField extends Field<Duration> {
  public constructor(protected readonly options: IIsDuration = {}) {
    super();
  }
  public validate(value: string): Duration {
    return isDuration(value, this.options);
  }
  public format(value: Duration): string {
    return value.toISO();
  }
}
