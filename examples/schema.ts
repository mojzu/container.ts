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
}

// Define field validators.
const nameField = new validate.StringField({ max: 128 });
const themeField = new validate.AsciiField({ max: 32, values: ["default", "customer"] });
const optionalThemeField = new validate.OptionalField(themeField, "default");
const customerField = new validate.StringField({ max: 128 });
const optionalCustomerField = new validate.OptionalField(customerField);

// Define schema using fields.
const groupSchema = validate.buildSchema({
  name: nameField,
  information: {
    theme: optionalThemeField,
    customer: optionalCustomerField,
  },
});

// Validate input data.
const input = {
  name: "GroupName",
  information: {
    theme: "customer",
    customer: "CustomerName",
  },
};
const validated = groupSchema.validate<IGroup>(input);
process.stdout.write(`${JSON.stringify(validated, null, 2)}\n`);
