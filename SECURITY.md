# Security & Privacy Guidelines

Security is a primary design principle of this web-based blog CMS.

## Security Practices Implemented

1. **Zero Server / Zero Database Footprint:** The application operates entirely client-side on static GitHub Pages.
2. **No Hardcoded Tokens or Secrets:** No GitHub Personal Access Tokens, secrets, or API keys are ever committed to the repository.
3. **Session-Only Storage:** User authentication tokens in `/admin/` are kept exclusively in browser `sessionStorage`. Closing the browser tab clears the token.
4. **HTML Sanitization & Safe Encoding:** All user inputs and Markdown renderings sanitize dynamic strings to prevent Cross-Site Scripting (XSS).
5. **Direct GitHub REST API:** All CMS actions communicate directly with official GitHub API endpoints (`https://api.github.com`) over HTTPS. No middleman servers or third-party proxies receive your credentials.
