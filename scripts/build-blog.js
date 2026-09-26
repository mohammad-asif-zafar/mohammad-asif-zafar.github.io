const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://mohammad-asif-zafar.github.io';
const BLOG_DIR = path.join(__dirname, '../content/blog');
const POSTS_JSON_PATH = path.join(__dirname, '../content/posts.json');
const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');
const RSS_PATH = path.join(__dirname, '../feed.xml');

function parseFrontMatter(text) {
	const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
	const match = regex.exec(text);
	if (!match) return { meta: {}, content: text };

	const yamlLines = match[1].split('\n');
	const meta = {};
	let currentKey = null;

	yamlLines.forEach(line => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) return;

		if (trimmed.startsWith('- ') && currentKey) {
			if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
			meta[currentKey].push(trimmed.replace(/^- /, '').replace(/^["']|["']$/g, ''));
			return;
		}

		const colonIdx = line.indexOf(':');
		if (colonIdx > -1) {
			const key = line.slice(0, colonIdx).trim();
			let val = line.slice(colonIdx + 1).trim();
			val = val.replace(/^["']|["']$/g, '');

			if (val === 'true') val = true;
			else if (val === 'false') val = false;

			meta[key] = val;
			currentKey = key;
		}
	});

	return { meta, content: match[2] };
}

function buildBlog() {
	console.log('🚀 Starting Blog Build & Index Generator...');

	if (!fs.existsSync(BLOG_DIR)) {
		console.error(`Directory not found: ${BLOG_DIR}`);
		process.exit(1);
	}

	const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
	const posts = [];
	const categorySet = new Set([
		"Android",
		"Kotlin",
		"Jetpack Compose",
		"Kotlin Multiplatform",
		"Compose Multiplatform",
		"Architecture",
		"CI/CD",
		"Career",
		"Tutorials"
	]);

	files.forEach(file => {
		const filePath = path.join(BLOG_DIR, file);
		const text = fs.readFileSync(filePath, 'utf8');
		const { meta, content } = parseFrontMatter(text);

		if (!meta.slug || !meta.title) {
			console.warn(`⚠️ Skipping ${file}: Missing required 'slug' or 'title' in frontmatter.`);
			return;
		}

		const wordCount = content.trim().split(/\s+/).length;
		const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

		if (meta.category) {
			categorySet.add(meta.category);
		}

		posts.push({
			title: meta.title,
			slug: meta.slug,
			description: meta.description || '',
			date: meta.date || new Date().toISOString().split('T')[0],
			updatedAt: meta.updatedAt || meta.date || new Date().toISOString().split('T')[0],
			author: meta.author || 'Mohammad Asif Zafar',
			category: meta.category || 'Android',
			tags: Array.isArray(meta.tags) ? meta.tags : [meta.category || 'Android'],
			coverImage: meta.coverImage || 'images/blog/kotlin-coroutines.svg',
			published: meta.published !== false,
			readingTime: readingTime
		});
	});

	// Sort posts by date descending
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));

	const categories = Array.from(categorySet);

	// Write posts.json
	const postsData = {
		posts,
		categories
	};
	fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(postsData, null, 2), 'utf8');
	console.log(`✅ Generated posts.json with ${posts.length} posts.`);

	// Generate sitemap.xml
	generateSitemap(posts);

	// Generate feed.xml (RSS)
	generateRssFeed(posts);

	console.log('🎉 Blog build completed successfully!');
}

function generateSitemap(posts) {
	const published = posts.filter(p => p.published);

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

	published.forEach(post => {
		xml += `  <url>
    <loc>${SITE_URL}/blog/post.html?slug=${post.slug}</loc>
    <lastmod>${post.updatedAt || post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
	});

	xml += `</urlset>`;

	fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
	console.log(`✅ Generated sitemap.xml with ${published.length + 2} URLs.`);
}

function generateRssFeed(posts) {
	const published = posts.filter(p => p.published);

	let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Mohammad Asif Zafar - Engineering Blog</title>
  <link>${SITE_URL}/blog/</link>
  <description>Technical articles on Android, Kotlin, Jetpack Compose, and Kotlin Multiplatform</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

	published.forEach(post => {
		xml += `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${SITE_URL}/blog/post.html?slug=${post.slug}</link>
    <guid>${SITE_URL}/blog/post.html?slug=${post.slug}</guid>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <description><![CDATA[${post.description}]]></description>
    <author>${post.author}</author>
    <category>${post.category}</category>
  </item>
`;
	});

	xml += `</channel>
</rss>`;

	fs.writeFileSync(RSS_PATH, xml, 'utf8');
	console.log(`✅ Generated feed.xml (RSS feed).`);
}

buildBlog();
