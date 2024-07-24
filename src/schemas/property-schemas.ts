import { err, ok } from "neverthrow";
import { z } from "zod";

export const richTextSchema = z.object({
  type: z.string(),
  text: z.object({
    content: z.string(),
    link: z
      .object({
        url: z.string().url(),
      })
      .nullable(),
  }),
  annotations: z.object({
    bold: z.boolean(),
    italic: z.boolean(),
    strikethrough: z.boolean(),
    underline: z.boolean(),
    code: z.boolean(),
  }),
  plain_text: z.string(),
  href: z.string().nullable(),
});

export const richTextPropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["rich_text"]),
    rich_text: z.array(richTextSchema),
  })
  .transform((textObj) => {
    if (textObj.rich_text?.[0]?.plain_text === undefined) {
      return err(`text`);
    }

    return ok(textObj.rich_text[0].plain_text);
  });

export const urlSchema = z
  .object({
    id: z.string(),
    type: z.enum(["url"]),
    url: z.string().nullable(),
  })
  .transform((urlObj) => {
    if (urlObj.url === null) {
      return err(`URL`);
    }
    return ok(urlObj.url);
  });

export const userPropertySchema = z.object({
  object: z.enum(["user"]),
  id: z.string(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  type: z.enum(["person"]).optional(),
  person: z.any().optional(),
});

export const peoplePropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["people"]),
    people: z.array(userPropertySchema),
  })
  .transform((peopleObj) => {
    if (peopleObj.people.length === 0) {
      return err(`people`);
    }
    return ok(peopleObj.people);
  });

export const checkboxPropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["checkbox"]),
    checkbox: z.boolean(),
  })
  .transform((checkboxObj) => ok(checkboxObj.checkbox));

export const datePropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["date"]),
    date: z
      .object({
        start: z.string(),
        end: z.string().nullable(),
        time_zone: z.string().nullable(),
      })
      .nullable(),
  })
  .transform((dateObj) => {
    if (dateObj.date === null) return err(`date`);
    return ok(dateObj.date.start);

    // Returns the date time string if not an interval or contains time-zone data
    // otherwise, return date object
    // return ok('strking')
    /* return ok(
      (dateObj.date.end === null && dateObj.date.time_zone === null)
      ? dateObj.date.start
      : dateObj.date
    ) 
    */
  });

export const selectPropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["select"]),
    select: z
      .object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
      .nullable(),
  })
  .transform((selectObj) => {
    if (selectObj.select === null) return err(`select`);
    return ok(selectObj.select.name);
  });

export const statusPropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["status"]),
    status: z
      .object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
      .nullable(),
  })
  .transform((statusObj) => {
    if (statusObj.status === null) {
      return err(`status`);
    }
    return ok(statusObj.status.name);
  });

export const titlePropertySchema = z
  .object({
    id: z.string(),
    type: z.enum(["title"]),
    title: z.array(richTextSchema),
  })
  .transform((titleObj) => {
    if (titleObj.title?.[0]?.plain_text === undefined) {
      return err(`title`);
    }

    return ok(titleObj.title[0].plain_text);
  });
