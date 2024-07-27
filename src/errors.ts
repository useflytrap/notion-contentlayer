import {
  createHumanLogs,
  event,
  explanation,
  solution,
  createTextFormatter,
} from "human-logs"

export const notionError = createHumanLogs(
  [
    event("fetching_posts_failed", "fetching posts failed", {
      params: {},
    }),
    event("fetching_page_contents_failed", "fetching content for page failed", {
      params: {},
    }),
    explanation(
      "missing_params",
      "the {paramType} `{paramName}` is missing for post with ID `{postId}`, and no fallback was provided",
      {
        params: {
          paramType: "",
          paramName: "",
          postId: "",
        },
      }
    ),
    explanation(
      "unsupported_blocktype",
      "unsupported block type `{blockType}` is is included in this page",
      {
        params: {
          blockType: "",
        },
      }
    ),
    explanation(
      "parsing_property_failed",
      "parsing property `{propertyName}` failed because of a schema parsing error.\nZod errors: {formErrors}\nError paths: {errorPaths}\n-- Data --\n{data}\n-- Data --",
      {
        params: {
          propertyName: "",
          formErrors: "",
          errorPaths: "",
          data: "",
        },
      }
    ),
    explanation(
      "notion_list_blocks_failed",
      "an error occured in Notion `client.blocks.children.list` function. Notion error:\n{error}",
      {
        params: { error: "" },
      }
    ),
    explanation(
      "notion_query_database_failed",
      "an error occured in Notion `client.databases.query` function. Notion error:\n{error}",
      {
        params: { error: "" },
      }
    ),
    solution(
      "add_missing_param",
      "add the missing {paramType} on your Notion page",
      {
        params: {},
      }
    ),
    solution(
      "provide_fallback",
      "add a fallback to your parameter definition like this:\n\nurl(`{paramName}`, { fallback: `https://useflytrap.com` })",
      {
        params: {
          paramName: "",
        },
      }
    ),
    solution(
      "add_skip_missing_fields",
      "if you want to skip posts that have missing fields, add `skipMissingFields`: true to your `fetchPosts` call like this: `notionSource.fetchPosts({ skipMissingFields: true })`",
      {
        params: {},
      }
    ),
    solution(
      "remove_unsupported_block",
      "remove the unsupported block from your Notion page",
      {
        params: {},
      }
    ),
    solution(
      "request_blocktype",
      "request support for this block type by opening an issue on GitHub",
      {
        params: {},
        actions: [
          {
            text: "Open an issue",
            href: "https://github.com/useflytrap/notion-contentlayer/issues/new",
          },
        ],
      }
    ),
    solution("open_issue", "open an issue for this on GitHub", {
      params: {},
      actions: [
        {
          text: "Open an issue",
          href: "https://github.com/useflytrap/notion-contentlayer/issues/new",
        },
      ],
    }),
  ],
  {
    formatter: createTextFormatter({
      eventsPrefix: "🚧 ",
      solutionsPrefix: "🛠️ ",
    }),
  }
)
