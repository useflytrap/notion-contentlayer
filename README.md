<img src="https://raw.githubusercontent.com/useflytrap/notion-contentlayer/main/.github/assets/cover.png" alt="Notion contentlayer cover" />

<div align="center">
  <a href="https://discord.gg/tQaADUfdeP">💬 Join our Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://x.com/useflytrap">𝕏 Follow us</a>
  <br />
</div>

## Notion Contentlayer

[![npm version][npm-version-src]][npm-href]
[![npm downloads][npm-downloads-src]][npm-href]
[![Github Actions][github-actions-src]][github-actions-href]

> Type-safe Notion contentlayer to easily build Notion-backed blogs, changelogs and more

Notion Contentlayer is a type-safe solution for easily fetching and rendering Notion content. Content is transformed to [MDAST](https://github.com/syntax-tree/mdast), so you can easily integrate with the [Remark](https://github.com/remarkjs/remark) and [Rehype](https://github.com/rehypejs/rehype) ecosystem. [Read more →](#-integrate-with-remark--rehype)

## Features

- Runtime & type-safe way to consume Notion page properties.
- Versatile renderer for MDAST content. [Learn more →](#-versatile-renderer-for-mdast)
- Integrates with Remark & Rehype ecosystem. [Learn more →](#-integrate-with-remark-rehype)

## ⚡️ Quickstart

1. Install the Notion contentlayer package
```sh
$ npm install notion-contentlayer
```

2. Setup a Notion database for your content

Hello World

<details>
  <summary>
    How do I find my API key and table ID?
  </summary>

Lorem ipsum dolor sit amet
</details>

3. Create Notion source

```typescript
import { createNotionSource, url, people, checkbox, text, date, select, status, title } from "notion-contentlayer"
import { Client } from "@notionhq/client"

const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
})

const notionSource = createNotionSource({
  properties: {
    cover: url("Image"),
    authors: people("Authors"),
    isFeatured: checkbox("Featured"),
    slug: text("Slug"),
    publishedDate: date("Date"),
    isPublished: checkbox("Published"),
    description: text("Description"),
    category: select("Category"),
    status: status("Status"),
    featuredCover: text("FeaturedImage"),
    title: title("Page"),
  },
  client: notionClient,
  databaseId: process.env.NOTION_TABLE_ID as string,
})
```

4. Consume the content

All `notion-contentlayer` functions have Rust-inspired error handling built-in, so you don't need to `try` / `catch` anything. Just consume as below.

```typescript
// 👇 `content`: true fetches the content for each blog post
const postResult = await notionSource.fetchPosts({ content: true })
//    ^^^^^^^^^^ postResult is a `Result`

if (postResult.isErr()) {
  // Render error state
  console.error(postResult.error)
  return
}

const posts = postResult.value;
/*
import { Root } from "@types/mdast"

`posts` is of type:
type Posts = {
  cover: string
  authors: User[]
  isFeatured: boolean
  slug: string
  publishedDate: Date
  isPublished: boolean
  category: string
  status: string
  featuredCover: string
  title: string
  blocks: Root
}[]
*/
```

## 🎥 Versatile renderer for MDAST

TODO Write Docs

## ⛓️ Integrate with Remark & Rehype

Since `notion-contentlayer` transforms all Notion blocks into a [MDAST](https://github.com/syntax-tree/mdast), you can perfectly integrate with the [Remark](https://github.com/remarkjs/remark) and [Rehype](https://github.com/rehypejs/rehype) ecosystem.

Here's an example of how to use it to render HTML

```typescript
const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
})

const notionSource = createNotionSource({
  // your options
})

const mdastResult = await notionSource.getPostContents('post-id-123')
if (mdastResult.isErr()) {
  console.error(mdastResult.error)
  return
}

const file = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(mdastResult.value)

console.log(String(file))
// => "<h1>Notion example</h1><h2>Autolink literals</h2> ..."
```

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run the tests using `pnpm dev`

## License

Made with ❤️ in Helsinki, Finland.

Published under [MIT License](./LICENSE).

<!-- Links -->

[npm-href]: https://www.npmjs.com/package/notion-contentlayer
[github-actions-href]: https://github.com/useflytrap/notion-contentlayer/actions/workflows/ci.yml

<!-- Badges -->

[npm-version-src]: https://badgen.net/npm/v/notion-contentlayer?color=black
[npm-downloads-src]: https://badgen.net/npm/dw/notion-contentlayer?color=black
[prettier-src]: https://badgen.net/badge/style/prettier/black?icon=github
[github-actions-src]: https://github.com/useflytrap/notion-contentlayer/actions/workflows/ci.yml/badge.svg
