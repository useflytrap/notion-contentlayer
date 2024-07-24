import { createHumanLogs } from "human-logs";

export const notionError = createHumanLogs({
  events: {
    fetching_posts_failed: "Fetching posts failed",
    saving_cache_failed: "Saving content to cache failed",
    fetching_page_contents_failed: "Fetching content for page failed",
  },
  explanations: {
    package_json_not_found:
      "because a package.json file could not be found while traversing up the filetree.",
    missing_params: {
      template:
        'because the {parameterType} "{parameterName}" is missing for post, and no fallback was provided.',
      params: {
        parameterType: "",
        parameterName: "",
      },
    },
    unsupported_blocktype: {
      template:
        'because unsupported block type "{blockType}" is included in this page.',
      params: {
        blockType: "",
      },
    },
  },
  solutions: {
    provide_fallback: {
      template:
        'add a fallback to your parameter definition like this: \n\nurl("{parameterName}", { fallback: "https://useflytrap.com" })',
      params: {
        parameterName: "",
      },
    },
    add_missing_param: {
      template: "add the missing {parameterType} on Notion",
      params: {
        notionPageUrl: "",
        parameterType: "",
      },
      actions: [
        {
          text: "Open Notion",
          href: "https://notion.so",
        },
      ],
    },
    remove_unsupported_block:
      "remove the unsupported block from your Notion page.",
    request_blocktype: {
      template:
        "request support for this block type by opening an issue on GitHub.",
      params: {},
      actions: [
        {
          text: "Open an issue",
          href: "https://github.com",
        },
      ],
    },
  },
});
