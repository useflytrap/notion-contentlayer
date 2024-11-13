import { Client } from "@notionhq/client"
import type { Root } from "mdast"
import { Ok, Result } from "neverthrow"
import { z, ZodSchema } from "zod"

export type NotionSourceOptions<T> = {
  properties: T
  client: Client
  databaseId: string
}

export type NotionProperty<PropertySchema extends ZodSchema> = {
  propertyName: string
  schema: PropertySchema
  fallback: unknown | undefined
}

export type SchemaOutputs<T extends Record<string, NotionProperty<ZodSchema>>> =
  {
    [P in keyof T]: ExtractOk<z.infer<T[P]["schema"]>>
  } & {
    id: string
  }

export type FetchPostsOptions = {
  content: boolean
  /**
   * If set to true, missing fields in posts will not throw, but instead
   * those posts will be not returned
   */
  skipMissingFields: boolean
  /**
   * @default true
   */
  allowMissingBlocktypes: boolean
}

// Utility type to extract the Ok variant's type
export type ExtractOk<T> = T extends Ok<infer U, unknown> ? U : never

export type UnwrappedSchemaTransform<T extends ZodSchema> = ReturnType<
  z.infer<T>["unwrap"]
>

type TransformedPost<T extends Record<string, NotionProperty<ZodSchema>>>  = SchemaOutputs<T> & { blocks: Root }

export type NotionSource<T extends Record<string, NotionProperty<ZodSchema>>> = {
  fetchPosts: (options: FetchPostsOptions) => Promise<Result<Array<SchemaOutputs<T> | TransformedPost<T>>, unknown>>,
  getPostContents: (postId: string, options: Partial<Pick<FetchPostsOptions, "allowMissingBlocktypes">>) => Promise<Result<Root, unknown>>
}
