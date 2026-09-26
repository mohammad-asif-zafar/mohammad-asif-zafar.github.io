# Engineering Blog Architecture & Guide

This website includes a integrated public engineering blog hosted on GitHub Pages.

## Public Routes

- **Blog Homepage:** [`/blog/`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/blog/index.html)
- **Article Detail Page:** [`/blog/post.html?slug=<slug>`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/blog/post.html)
- **RSS Feed:** [`/feed.xml`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/feed.xml)
- **Sitemap:** [`/sitemap.xml`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/sitemap.xml)

---

## Content Format

Blog posts are written in standard Markdown with YAML frontmatter and stored in the `content/blog/` directory.

### Example Frontmatter (`content/blog/sample-article.md`)

```markdown
---
title: "Understanding Kotlin Coroutines"
slug: "understanding-kotlin-coroutines"
description: "A comprehensive guide to Kotlin Coroutines and structured concurrency."
date: "2026-03-01"
updatedAt: "2026-03-01"
author: "Mohammad Asif Zafar"
category: "Kotlin"
tags:
  - Kotlin
  - Coroutines
  - Android
coverImage: "images/blog/kotlin-coroutines.svg"
published: true
---

# Article Title

Content in Markdown...
```

---

## Features

- **Live Search:** Instant client-side search across title, description, category, and tags.
- **Category & Tag Filters:** Interactive category pills for quick filtering.
- **Syntax Highlighting:** Integrated Highlight.js (Atom One Dark theme) supporting Kotlin, Java, Swift, Bash, XML, YAML, and JSON.
- **Reading Time Calculation:** Automatic estimation based on word count.
- **SEO & Social Sharing:** Native Open Graph, Twitter Cards, LinkedIn share buttons, and copy link functionality.
- **Draft Protection:** Posts with `published: false` in frontmatter are excluded from the public blog and search indices.
