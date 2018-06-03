/// <reference types="node" />
import * as process from "process";
import * as validate from "../src/lib/validate";

// Define data interface for schema.
interface IGroup {
  name: string;
  information: {
    theme: string;
    customer?: string;
  };
  map: { [key: string]: string };
  array: string[];
}

// Define field validators.
const nameField = new validate.StringField({ max: 128 });
const themeField = new validate.AsciiField({ max: 32, values: ["default", "customer"] });
const optionalThemeField = new validate.OptionalField(themeField, "default");
const customerField = new validate.StringField({ max: 128 });
const optionalCustomerField = new validate.OptionalField(customerField);

// Define schema using fields.
const groupSchema = new validate.Schema<IGroup>({
  name: nameField,
  information: {
    theme: optionalThemeField,
    customer: optionalCustomerField
  },
  map: { "*": customerField },
  array: ["*", customerField]
});

// Validate input data.
const input1 = {
  name: "GroupName",
  information: {
    theme: "customer",
    customer: "CustomerName"
  }
};
const validated1 = groupSchema.validate(input1);
process.stdout.write(`${JSON.stringify(validated1, null, 2)}\n`);

const input2 = {
  name: "GroupName",
  information: {},
  map: {},
  array: []
};
const validated2 = groupSchema.validate(input2);
process.stdout.write(`${JSON.stringify(validated2, null, 2)}\n`);
