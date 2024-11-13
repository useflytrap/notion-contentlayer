import * as React from 'react';
import type { Heading, Parent, PhrasingContent, Root, RootContent } from "mdast";
import { JSX } from "react";
import { notionError } from './errors';

type PropsHelper<ElementType extends HTMLElement, NodeType extends Parent> = React.DetailedHTMLProps<React.HTMLAttributes<ElementType>, ElementType> & {
  node: NodeType
}

export type RendererProps = {
  mdast: Root
  elementMap: {
    p: () => JSX.Element
    img: () => JSX.Element
    inlineCode: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { node: RootContent }) => JSX.Element
    a: () => JSX.Element
    blockquote: () => JSX.Element
    code: () => JSX.Element
    ul: () => JSX.Element
    ol: () => JSX.Element
    li: () => JSX.Element
    h1: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
    h2: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
    h3: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
    h4: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
    h5: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
    h6: (props: PropsHelper<HTMLHeadingElement, Heading>) => JSX.Element
  }
}

function renderPhrasingContent(node: PhrasingContent, elementMap: RendererProps['elementMap']) {
  if (node.type === "inlineCode") {
    const props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { node: RootContent } = {
      key: node.value,
      children: node.value,
      node,
    }

    return React.createElement(elementMap['inlineCode'] ?? 'code', props)
  }
  if (node.type === "text") {
    return React.createElement(React.Fragment, { key: node.value, children: node.value })
  }

  if (node.type === "link") {
    const props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & { node: RootContent } = {
      key: node.url,
      href: node.url,
      children: node.children.map((node) => renderPhrasingContent(node, elementMap)),
      node,
    }

    return React.createElement(elementMap['a'] ?? 'a', props)
  }

  throw notionError(["rendering_failed", "unsupported_phrasing_content", "request_phrasing_content_support"], {
    nodeType: node.type
  }).toString()
}

export function Renderer({ mdast, elementMap }: RendererProps) {
  let headingIndex    = 0
  let paragraphIndex  = 0
  let listIndex       = 0
  let listItemIndex   = 0
  let codeIndex       = 0
  let blockquoteIndex = 0

  const renderedMdast = mdast.children.map((node) => {
    // @ts-expect-error: @todo: do proper checks here and remove this
    if (node.children && node.children.length === 0) return undefined

    if (node.type === "heading") {
      const props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> & { node: Heading } = {
        key: `heading-${headingIndex++}`,
        children: node.children.map((node) => renderPhrasingContent(node, elementMap)),
        node
      }

      return React.createElement(elementMap[`h${node.depth}`] ?? `h${node.depth}`, props)
    }

    if (node.type === "paragraph") {
      const props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> & { node: RootContent } = {
        key: `paragraph-${paragraphIndex++}`,
        children: node.children.map((node) => renderPhrasingContent(node, elementMap)),
        node,
      }

      return React.createElement(elementMap[`p`] ?? 'p', props)
    }

    if (node.type === "image") {
      const props: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & { node: RootContent } = {
        key: node.url + node.alt,
        alt: node.alt ?? "No alternative text found",
        src: node.url,
        node,
      }

      return React.createElement(elementMap['img'] ?? 'img', props)
    }

    // @todo: definition, footnoteDefinition, html,
    // imageReference, list, listItem, table, tableCell, tableRow, thematicBReak,
    // yaml

    if (node.type === "blockquote") {
      const props: React.DetailedHTMLProps<React.BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement> & { node: RootContent } = {
        key: `blockquote-${blockquoteIndex++}`,
        node,
      }
      return React.createElement(elementMap['blockquote'] ?? 'blockquote', props)
    }

    if (node.type === "code") {
      const props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>  & { node: RootContent } = {
        key: `code-${codeIndex++}`,
        node,
        children: node.value,
      }

      return React.createElement(elementMap['code'] ?? 'code', props)
    }

    if (node.type === "list") {
      const props: React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement> & { node: RootContent } = {
        key: `list-${listIndex++}`,
        // children: node.children.map((node) => ),
        node,
      }

      if (node.ordered) {
        return React.createElement(elementMap['ul'] ?? 'ul', props)
      }
      return React.createElement(elementMap['ol'] ?? 'ol', props)
    }

    if (node.type === "listItem") {
      const props: React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement> & { node: RootContent } = {
        key: `list-item-${listItemIndex++}`,
        children: node.children.map((node) => {
          return null
        }),
        node,
      }

      return React.createElement(elementMap['li'] ?? 'li', props)
    }
  })

  return renderedMdast
}
