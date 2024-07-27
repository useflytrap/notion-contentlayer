/**
 * Known problems;
 * - nested list items not transformed correctly.
 */

import { Client } from "@notionhq/client"
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { Root } from "mdast"
import type { ZodSchema } from "zod"
import { notionError } from "./errors"
import { Result, err, fromAsyncThrowable, ok } from "neverthrow"
import {
  FetchPostsOptions,
  NotionProperty,
  NotionSourceOptions,
  SchemaOutputs,
} from "./types"
import { supportedBlockTypes } from "./schemas/block-schemas"

function getNotionBlocksByPageId(client: Client, pageId: string) {
  const listBlocks = fromAsyncThrowable(
    client.blocks.children.list,
    // @todo: fix this error
    (error) =>
      notionError(
        ["fetching_page_contents_failed", "notion_list_blocks_failed"],
        {
          error: String(error),
        }
      )
  )

  return listBlocks({
    block_id: pageId,
    page_size: 100,
  }).map((blockList) => blockList.results as BlockObjectResponse[])
}

function parseBlock(
  block: BlockObjectResponse,
  allowMissingBlocktypes = false
) {
  const blockSchema = supportedBlockTypes[block.type]
  if (blockSchema === undefined) return ok(undefined)
  if (allowMissingBlocktypes === false) {
    return err(
      notionError(
        [
          "fetching_page_contents_failed",
          "unsupported_blocktype",
          "remove_unsupported_block",
          "request_blocktype",
        ],
        {
          blockType: block.type,
        }
      )
    )
  }

  const parseResult = blockSchema.safeParse(block)

  if (parseResult.success === false) {
    return err(
      notionError(
        [
          "fetching_page_contents_failed",
          "unsupported_blocktype",
          "remove_unsupported_block",
          "request_blocktype",
        ],
        {
          blockType: block.type,
        }
      )
    )
  }

  return ok(parseResult.data)
}

function getPageMdast(
  blocks: BlockObjectResponse[],
  allowMissingBlocktypes = true
) {
  const children = blocks.map((block) => {
    return parseBlock(block, allowMissingBlocktypes)
  })

  const childrenCombined = Result.combine(children)
  return childrenCombined.map(
    (children) =>
      ({
        type: "root",
        children,
      }) satisfies Root
  )
}

function parseProperties<
  T extends Record<string, NotionProperty<ZodSchema>>,
  K extends object,
>(id: string, definitions: T, values: K) {
  const parsedProperties: Partial<SchemaOutputs<T>> = {}
  for (const [
    mappedPropertyName,
    { propertyName, schema, fallback },
  ] of Object.entries(definitions)) {
    const parseResult = schema.safeParse(
      values[propertyName as keyof typeof values]
    )

    if (parseResult.success) {
      const result = parseResult.data as Result<unknown, string>

      if (result.isErr() && fallback === undefined) {
        return err(
          notionError(
            [
              "fetching_posts_failed",
              "missing_params",
              "provide_fallback",
              "add_missing_param",
              "add_skip_missing_fields",
            ],
            {
              paramName: propertyName,
              paramType: result.error,
              postId: id,
            }
          )
        )
      }

      if (result.isErr() && fallback !== undefined) {
        // @ts-expect-error: parsed data will be correct type
        parsedProperties[mappedPropertyName as keyof SchemaOutputs<T>] =
          fallback
      }
      if (result.isOk()) {
        // @ts-expect-error: parsed data will be correct type
        parsedProperties[mappedPropertyName as keyof SchemaOutputs<T>] =
          result.value
      }
    } else {
      const formErrors = parseResult.error.flatten().formErrors.join("\n")
      const errorPaths = parseResult.error.issues
        .map((i) => `"${i.path.join(".")}"`)
        .join(", ")
      const data = JSON.stringify(
        values[propertyName as keyof typeof values],
        null,
        2
      )

      return err(
        notionError(["parsing_property_failed", "open_issue"], {
          propertyName,
          formErrors,
          errorPaths,
          data,
        })
      )
    }
  }
  // @todo: make sure `parsedProperties` isn't `Partial` anymore.
  return ok({
    ...parsedProperties,
    id,
  } as SchemaOutputs<T>)
}

function findNotionDatabaseById(client: Client, databaseId: string) {
  const query = fromAsyncThrowable(
    client.databases.query,
    // @todo: fix this error
    (error) =>
      notionError(["fetching_posts_failed", "notion_query_database_failed"], {
        error: String(error),
      })
  )

  return query({
    database_id: databaseId,
  }).map((result) => result.results as PageObjectResponse[])
}

export function createNotionSource<
  T extends Record<string, NotionProperty<ZodSchema>>,
>(options: NotionSourceOptions<T>) {
  async function fetchPosts({
    content = false,
    skipMissingFields,
    allowMissingBlocktypes,
  }: Partial<FetchPostsOptions> = {}) {
    // Assert server side
    const notionDatabase = findNotionDatabaseById(
      options.client,
      options.databaseId
    )
    const postsWithParsedProperties = notionDatabase.map((results) => {
      return results.map(({ id, properties }) =>
        parseProperties(id, options.properties, properties)
      )
    })
    // Filter away posts with missing fields if `skipMissingFields` is true
    const filteredPosts = postsWithParsedProperties.map(async (posts) => {
      if (skipMissingFields) {
        return posts.filter((post) => post.isOk())
      }
      return posts
    })

    const filteredPostsResult = await filteredPosts
    if (filteredPostsResult.isErr()) return filteredPostsResult

    const postResults = Result.combine(filteredPostsResult.value)
    if (postResults.isErr()) {
      return postResults
    }

    if (content === false) {
      return postResults
    }

    // Fetch the "blocks", and turn into MDAST.
    const posts = postResults.value
    const transformedPosts: (SchemaOutputs<T> & { blocks: Root })[] = []
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      const pageWithBlocksResult = await getNotionBlocksByPageId(
        options.client,
        post.id
      ).andThen((blocks) => getPageMdast(blocks, allowMissingBlocktypes))
      if (pageWithBlocksResult.isErr()) return pageWithBlocksResult
      transformedPosts.push({
        ...posts[i],
        blocks: pageWithBlocksResult.value,
      })
    }

    return ok(transformedPosts)
  }

  async function getPostContents(
    postId: string,
    {
      allowMissingBlocktypes,
    }: Pick<FetchPostsOptions, "allowMissingBlocktypes"> = {
      allowMissingBlocktypes: false,
    }
  ) {
    const pageMdast = await getNotionBlocksByPageId(
      options.client,
      postId
    ).andThen((blocks) => getPageMdast(blocks, allowMissingBlocktypes))
    return pageMdast
  }

  return {
    fetchPosts,
    getPostContents,
  }
}
