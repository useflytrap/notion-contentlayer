import { ZodSchema, z } from "zod";
import type {
  Code,
  Heading,
  Image,
  ListItem,
  Paragraph,
  PhrasingContent,
} from "mdast";

export const textPart = z
  .object({
    type: z.enum(["text"]),
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
  })
  .transform((textPartObject) => {
    if (textPartObject.text.link?.url) {
      return {
        type: "link",
        url: textPartObject.text.link?.url,
        children: [
          {
            type: "text",
            value: textPartObject.text.content,
          },
        ],
      } satisfies PhrasingContent;
    }

    if (textPartObject.annotations.bold) {
      return {
        type: "strong",
        children: [
          {
            type: "text",
            value: textPartObject.plain_text,
          },
        ],
      } satisfies PhrasingContent;
    }

    if (textPartObject.annotations.code) {
      return {
        type: "inlineCode",
        value: textPartObject.plain_text,
      } satisfies PhrasingContent;
    }

    if (textPartObject.annotations.italic) {
      return {
        type: "emphasis",
        children: [
          {
            type: "text",
            value: textPartObject.plain_text,
          },
        ],
      } satisfies PhrasingContent;
    }

    return {
      type: "text",
      value: textPartObject.plain_text,
    } satisfies PhrasingContent;
  });

const paragraphBlock = z
  .object({
    type: z.enum(["paragraph"]),
    paragraph: z.object({
      rich_text: z.array(textPart),
    }),
  })
  .transform((paragraphObject) => {
    return {
      type: "paragraph",
      children: paragraphObject.paragraph.rich_text,
    } satisfies Paragraph;
  });

const heading3Block = z
  .object({
    type: z.enum(["heading_3"]),
    heading_3: z.object({
      rich_text: z.array(textPart),
    }),
  })
  .transform((headingObject) => {
    return {
      type: "heading",
      depth: 3,
      children: headingObject.heading_3.rich_text,
    } satisfies Heading;
  });

const codeBlock = z
  .object({
    type: z.enum(["code"]),
    code: z.object({
      language: z.string(),
      caption: z.array(textPart),
      rich_text: z.array(textPart),
    }),
  })
  .transform((codeObject) => {
    return {
      type: "code",
      lang: codeObject.code.language,
      value: codeObject.code.rich_text[0].value ?? "// no code found",
      ...(codeObject.code.caption.length > 0 && {
        data: {
          caption: codeObject.code.caption.at(-1)?.value,
        },
      }),
    } satisfies Code;
  });

const bulletedListItem = z
  .object({
    type: z.enum(["bulleted_list_item"]),
    bulleted_list_item: z.object({
      rich_text: z.array(textPart),
    }),
  })
  .transform((bulletedListItemObject) => {
    return {
      type: "listItem",
      children: [
        {
          type: "paragraph",
          children: bulletedListItemObject.bulleted_list_item.rich_text,
        },
      ],
    } satisfies ListItem;
  });

const numberedListItem = z
  .object({
    type: z.enum(["numbered_list_item"]),
    numbered_list_item: z.object({
      rich_text: z.array(textPart),
    }),
  })
  .transform((numberedListItemObject) => {
    return {
      type: "listItem",
      children: [
        {
          type: "paragraph",
          children: numberedListItemObject.numbered_list_item.rich_text,
        },
      ],
    } satisfies ListItem;
  });

const imageBlock = z
  .object({
    type: z.enum(["image"]),
    image: z.object({
      caption: z.array(textPart),
      type: z.enum(["external"]),
      external: z.object({
        url: z.string(),
      }),
    }),
  })
  .transform((imageObject) => {
    return {
      type: "image",
      url: imageObject.image.external.url,
      ...(imageObject.image.caption.at(0)?.value && {
        alt: imageObject.image.caption.at(0)?.value,
      }),
    } satisfies Image;
  });

export const supportedBlockTypes: Record<string, ZodSchema | undefined> = {
  paragraph: paragraphBlock,
  heading_3: heading3Block,
  code: codeBlock,
  bulleted_list_item: bulletedListItem,
  numbered_list_item: numberedListItem,
  image: imageBlock,
};
