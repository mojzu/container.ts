import { DateTime } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate that value is a valid time zone supported by 'luxon' library. */
export function isTimeZone(value = ""): string {
  try {
    const datetime = DateTime.local().setZone(value);
    if (datetime.isValid !== true) {
      throw new ValidateError(EValidateError.IsTimeZoneError, value);
    }
    return datetime.zoneName;
  } catch (error) {
    throw new ValidateError(EValidateError.IsTimeZoneError, value, error);
  }
}

export class TimeZoneField extends Field<string> {
  public validate(value: string): string {
    return isTimeZone(value);
  }
}
