# Web Admin CMS Guide

The private Web Admin CMS interface allows you to write, edit, draft, publish, and delete blog posts directly from your web browser without leaving GitHub Pages.

## Admin URL

- **Admin Web Dashboard:** [`/admin/`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/admin/index.html)

---

## Authentication Setup

1. Go to your GitHub Settings -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-Grained Tokens** (or Tokens Classic).
2. Generate a new token for the repository `mohammad-asif-zafar.github.io`.
3. Grant **Repository Permissions**:
   - **Contents:** Read & Write (`contents:read/write`)
4. Copy the token string (e.g. `ghp_xxxxxxxxxxxx`).
5. Open [`/admin/`](file:///Volumes/DevelopmentSSD/Android/Projects/GitHub/mohammad-asif-zafar.github.io/admin/index.html) in your browser.
6. Enter:
   - **GitHub Owner:** `mohammad-asif-zafar`
   - **GitHub Repository:** `mohammad-asif-zafar.github.io`
   - **Personal Access Token:** Paste token here.
7. Click **Authenticate & Login**.

> [!NOTE]
> Your authentication token is stored only in your browser's local `sessionStorage`. It is never transmitted to any third-party server or saved in the codebase.

---

## Publishing Workflow

1. Navigate to **New Post** (`#posts/new`).
2. Fill in the **Title**, **Slug**, **Description**, **Category**, and **Tags**.
3. Upload a cover image using the upload button or enter a path under `images/blog/`.
4. Write your post in the split-view Markdown editor. Review the live preview on the right pane.
5. Click **Save Draft** to commit a draft (`published: false`) or **Publish Post** to commit a published post (`published: true`).
6. The CMS commits the markdown file directly to `content/blog/<slug>.md` and updates `content/posts.json` via GitHub REST API.
7. GitHub Actions automatically builds and deploys the updated website!
