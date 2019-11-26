import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { isFloat } from "./is-float";

export interface ILatitudeLongitude {
  latitude: number;
  longitude: number;
}

/** Wrapper for validator isLatLong. */
export function isLatitudeLongitude(value = ""): ILatitudeLongitude {
  try {
    if (validator.isLatLong(value) !== true) {
      throw new ValidateError(EValidateError.IsLatitudeLongitudeError, value);
    }
    // Split string and trim for parsing as floats.
    const values = value.split(",").map((v) => v.trim());
    const latitudeLongitude: ILatitudeLongitude = {
      latitude: isFloat(values[0]),
      longitude: isFloat(values[1])
    };
    return latitudeLongitude;
  } catch (error) {
    throw new ValidateError(EValidateError.IsLatitudeLongitudeError, value, error);
  }
}

export class LatitudeLongitudeField extends Field<ILatitudeLongitude> {
  public validate(value: string): ILatitudeLongitude {
    return isLatitudeLongitude(value);
  }
  public format(value: ILatitudeLongitude): string {
    return `${value.latitude},${value.longitude}`;
  }
}
