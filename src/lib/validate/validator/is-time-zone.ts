import { DateTime } from "luxon";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate that value is a valid time zone supported by 'luxon' library. */
export function isTimeZone(value = ""): string {
  let datetime: DateTime;

  try {
    datetime = DateTime.local().setZone(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsTimeZoneError, value, error);
  }

  if (!datetime.isValid) {
    throw new ValidateError(EValidateError.IsTimeZoneError, value);
  }
  return datetime.zoneName;
}

export class TimeZoneField extends Field<string> {
  public validate(value: string): string {
    return isTimeZone(value);
  }
}
