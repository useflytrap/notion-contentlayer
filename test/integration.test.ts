import { describe, it } from "vitest"
import { createNotionSource } from "../src"
import { Client } from "@notionhq/client"
import {
  checkbox,
  date,
  people,
  select,
  status,
  text,
  title,
  url,
} from "../src/shorthands"

describe(
  "integration tests",
  {
    skip:
      process.env.NOTION_API_KEY === undefined ||
      process.env.NOTION_TABLE_ID === undefined,
    timeout: 10_000,
  },
  () => {
    it("reads content", async () => {
      const notionClient = new Client({
        auth: process.env.NOTION_API_KEY,
      })

      const mockNotionSource = createNotionSource({
        properties: {
          cover: url("Image"),
          authors: people("Authors"),
          isFeatured: checkbox("Featured"),
          slug: text("Slug"),
          publishedDate: date("Date"),
          isPublished: checkbox("Published"),
          description: text("Description"),
          // @todo: type narrowing for these (eg. <"News" | "Guides">)
          category: select("Category"),
          status: status("Status"),
          featuredCover: text("FeaturedImage"),
          title: title("Page"),
        },
        client: notionClient,
        databaseId: process.env.NOTION_TABLE_ID as string,
      })
      const postsResult = await mockNotionSource.fetchPosts({
        skipMissingFields: true,
        content: true,
      })
      console.log(postsResult._unsafeUnwrap())
    })
  }
)
