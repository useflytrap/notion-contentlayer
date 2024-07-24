/**
 * Known problems;
 * - nested list items not transformed correctly.
 */

import { Client } from "@notionhq/client";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Root } from "mdast";
import type { ZodSchema } from "zod";
import { notionError } from "./errors";
import { err, ok } from "neverthrow";
import {
  FetchPostsOptions,
  NotionProperty,
  NotionSourceOptions,
  SchemaOutputs,
} from "./types";

async function getBlocksByPageId(client: Client, pageId: string) {
  const blocks = await client.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });
  return blocks;
}

async function getPageMdast(
  client: Client,
  postId: string,
  allowMissingBlocktypes: boolean = true,
) {
  const mdast: Root = {
    type: "root",
    children: [],
  };

  const blocks = await getBlocksByPageId(client, postId);

  if (blocks === undefined || blocks?.results?.length === 0) {
    return ok(mdast);
  }

  for (let i = 0; i < blocks.results.length; i++) {
    // @ts-expect-error: @todo: fix this lazy typing
    const blockSchema = supportedBlockTypes[blocks.results[i].type];
    if (blockSchema === undefined && allowMissingBlocktypes === true) {
      continue;
    }
    if (blockSchema === undefined && allowMissingBlocktypes === false) {
      return err(
        notionError({
          events: ["fetching_page_contents_failed"],
          explanations: ["unsupported_blocktype"],
          solutions: ["remove_unsupported_block", "request_blocktype"],
          params: {
            blockType: (blocks.results[i] as BlockObjectResponse).type,
          },
        }),
      );
    }

    const parseResult = blockSchema.safeParse(blocks.results[i]);

    if (parseResult.success === false) {
      return err(
        notionError({
          events: ["fetching_page_contents_failed"],
          explanations: ["unsupported_blocktype"],
          solutions: ["remove_unsupported_block", "request_blocktype"],
          params: {
            blockType: (blocks.results[i] as BlockObjectResponse).type,
          },
        }),
      );
    }

    mdast.children.push(parseResult.data);
  }

  return ok(mdast);
}

function parseProperties<
  T extends Record<string, NotionProperty<ZodSchema>>,
  K extends object,
>(id: string, definitions: T, values: K) {
  const parsedProperties: Partial<SchemaOutputs<T>> = {};
  for (const [
    mappedPropertyName,
    { propertyName, schema, fallback },
  ] of Object.entries(definitions)) {
    const parseResult = schema.safeParse(
      values[propertyName as keyof typeof values],
    );

    if (parseResult.success) {
      const result = parseResult.data;

      if (result.err && fallback === undefined) {
        const errorThing = notionError({
          events: ["fetching_posts_failed"],
          explanations: ["missing_params"],
          solutions: ["add_missing_param", "provide_fallback"],
          params: {
            notionPageUrl: "https://www.notion.so",
            parameterName: propertyName,
            parameterType: result.val,
          },
        });

        return err(errorThing);
      }

      parsedProperties[mappedPropertyName as keyof SchemaOutputs<T>] =
        result.err && fallback ? fallback : result.val;
    } else {
      const errorMessageParts = [
        `Parsing property "${propertyName}" failed because of a schema parse error.`,
        `Zod Errors: `,
        parseResult.error.flatten().formErrors.join("\n"),
        `Error paths: ${parseResult.error.issues.map(
          (i) => `"${i.path.join(".")}"`,
        )}`,
        `-- Data:`,
        JSON.stringify(values[propertyName as keyof typeof values], null, 2),
        `--`,
        "Please open an issue for this here https://github.com/useflytrap/contentlayer/issues",
      ];
      return err(errorMessageParts.join("\n"));
    }
  }
  // @todo: make sure `parsedProperties` isn't `Partial` anymore.
  return ok({
    ...parsedProperties,
    id,
  } as SchemaOutputs<T>);
}

export function createNotionSource<
  T extends Record<string, NotionProperty<ZodSchema>>,
>(options: NotionSourceOptions<T>) {
  async function fetchPosts({
    content,
    skipMissingFields,
    allowMissingBlocktypes,
  }: Partial<FetchPostsOptions> = {}) {
    // Assert server side

    const databaseResult = await options.client.databases.query({
      database_id: options.databaseId,
    });

    let parsedPostResults = databaseResult.results.map((result) =>
      // @ts-expect-error: @todo: fix types
      parseProperties(result.id, options.properties, result.properties),
    );

    if (skipMissingFields) {
      parsedPostResults = parsedPostResults.filter((result) => !result.err);
    }

    const postResults = Result.all(...parsedPostResults);

    if (postResults.err) {
      return postResults;
    }

    if (content === false) {
      return postResults;
    }

    // Fetch the "blocks", and turn into MDAST.
    const postsWithBlocks = await Promise.all(
      postResults.val.map(async (post) => {
        return {
          ...post,
          mdast: (
            await getPageMdast(options.client, post.id, allowMissingBlocktypes)
          ).unwrap(),
        };
      }),
    );

    return ok(postsWithBlocks);
  }

  /**
   * Reads posts from cache. If none exist, returns an empty array, and fetches
   * the posts in the background.
   */
  function readPosts() {}

  function getPostContents(postId: string) {
    // return getPageMdast(postId)
  }

  return {
    readPosts,
    fetchPosts,
    getPostContents,
  };
}
