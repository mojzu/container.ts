import { DateTime, DateTimeOptions } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isDateTime options. */
export interface IIsDateTime extends DateTimeOptions {}

/** Validate that value is a valid date and time parsed by 'luxon' library. */
export function isDateTime(value = "", options: IIsDateTime = {}): DateTime {
  options.zone = options.zone || "UTC";
  try {
    const datetime = DateTime.fromISO(value, options);
    if (datetime.isValid !== true) {
      throw new ValidateError(EValidateError.IsDateTimeError, value);
    }
    return datetime;
  } catch (error) {
    throw new ValidateError(EValidateError.IsDateTimeError, value, error);
  }
}

export class DateTimeField extends Field<DateTime> {
  public constructor(protected readonly options: IIsDateTime = {}) {
    super();
  }
  public validate(value: string): DateTime {
    return isDateTime(value, this.options);
  }
  public format(value: DateTime): string | null {
    return value.toISO();
  }
}
