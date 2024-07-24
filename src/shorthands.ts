import type { ZodSchema } from "zod";
import type { UnwrappedSchemaTransform } from "./types";
import {
  checkboxPropertySchema,
  datePropertySchema,
  peoplePropertySchema,
  richTextPropertySchema,
  selectPropertySchema,
  statusPropertySchema,
  titlePropertySchema,
  urlSchema,
} from "./schemas/property-schemas";

const createShorthand = <PropertySchema extends ZodSchema>(
  schema: PropertySchema,
) => {
  return (
    propertyName: string,
    fallback?: UnwrappedSchemaTransform<PropertySchema>,
  ) => ({
    propertyName,
    schema,
    fallback,
  });
};

export const url = createShorthand(urlSchema);
export const people = createShorthand(peoplePropertySchema);
export const checkbox = createShorthand(checkboxPropertySchema);
export const text = createShorthand(richTextPropertySchema);
export const date = createShorthand(datePropertySchema);
export const select = createShorthand(selectPropertySchema);
export const status = createShorthand(statusPropertySchema);
export const title = createShorthand(titlePropertySchema);
