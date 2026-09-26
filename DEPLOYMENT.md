# Deployment & GitHub Actions Guide

This project uses **GitHub Pages** with automated deployments triggered via **GitHub Actions**.

## Automated Workflow (`.github/workflows/deploy.yml`)

Whenever a commit is pushed to the `main` branch (either directly or via the Web Admin CMS):

1. **Checkout:** Checks out the latest repository code.
2. **Node.js Setup:** Installs Node.js v20 environment.
3. **Build Script:** Executes `node scripts/build-blog.js`:
   - Parses all markdown files in `content/blog/`.
   - Generates/updates `content/posts.json`.
   - Generates updated `sitemap.xml` and `feed.xml` (RSS feed).
4. **Deploy:** Uploads static artifacts and deploys the website to GitHub Pages automatically.

---

## Configuring GitHub Pages in Repository Settings

1. In your GitHub repository `mohammad-asif-zafar/mohammad-asif-zafar.github.io`, go to **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. Pushing any change or publishing a post via `/admin/` will automatically trigger the workflow!
