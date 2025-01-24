# Markdown to LaTeX Converter

A Node.js package for converting Markdown files into LaTeX documents. This tool parses Markdown content, generates LaTeX code, and handles various Markdown elements like headers, lists, images, links, tables, and code blocks.

## Features

- Converts Markdown headers (`#`, `##`, `###`, etc.) to LaTeX sections (`\chapter`, `\section`, etc.).
- Converts unordered (`*`, `-`) and ordered lists (`1.`) to LaTeX `itemize` and `enumerate`.
- Supports inline styles like bold, italic, and inline code.
- Converts links and images to LaTeX `\href` and `\includegraphics`.
- Converts Markdown tables into LaTeX tables.
- Handles code blocks as `verbatim` environments.
- Escapes LaTeX special characters in the Markdown content.
- Preserves math expressions (single `$...$` for inline math, and `$$...$$` for block math).

## Installation

```
npm install markdowntolatexconverter
```

## Usage

```
node MarkdownToLatexConverter.js <input-file.md> [output-file.tex]
```
