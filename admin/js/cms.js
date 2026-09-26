/**
 * Portfolio Blog CMS Engine
 * Handles GitHub REST API authentication, post creation, editing, draft management,
 * image uploading, and real-time markdown preview rendering.
 */

const CMS_STORAGE_KEY = 'asif_portfolio_cms_auth';
const DRAFT_STORAGE_KEY = 'asif_portfolio_cms_draft_';

let currentAuth = {
	owner: 'mohammad-asif-zafar',
	repo: 'mohammad-asif-zafar.github.io',
	token: ''
};

let postsIndex = { posts: [], categories: [] };
let currentEditingSlug = null;
let currentPostSha = null;

$(document).ready(function() {
	initAuth();
	setupEventHandlers();
	handleRouting();

	$(window).on('hashchange', function() {
		handleRouting();
	});
});

/* ==========================================================================
   AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */

function initAuth() {
	const stored = sessionStorage.getItem(CMS_STORAGE_KEY);
	if (stored) {
		try {
			currentAuth = JSON.parse(stored);
		} catch (e) {
			console.error("Failed to parse auth token", e);
		}
	}
}

function isAuthenticated() {
	return currentAuth.token && currentAuth.owner && currentAuth.repo;
}

function login(owner, repo, token) {
	currentAuth = { owner, repo, token };

	// Validate token against GitHub API
	showToast('Validating GitHub Token...', 'info');

	ghRequest('GET', `/repos/${owner}/${repo}`)
		.then(repoData => {
			sessionStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(currentAuth));
			showToast(`Authenticated successfully for ${repoData.full_name}!`, 'success');
			window.location.hash = '#dashboard';
		})
		.catch(err => {
			showToast('Authentication failed. Please verify your token and repository permissions.', 'danger');
			console.error("Auth error:", err);
		});
}

function logout() {
	sessionStorage.removeItem(CMS_STORAGE_KEY);
	currentAuth = { owner: 'mohammad-asif-zafar', repo: 'mohammad-asif-zafar.github.io', token: '' };
	window.location.hash = '#login';
	showToast('Logged out successfully.', 'info');
}

/* ==========================================================================
   GITHUB REST API CLIENT
   ========================================================================== */

function ghRequest(method, endpoint, data = null) {
	const url = `https://api.github.com${endpoint}`;
	const headers = {
		'Accept': 'application/vnd.github.v3+json',
		'Authorization': `token ${currentAuth.token}`
	};

	const options = {
		url: url,
		type: method,
		headers: headers,
		dataType: 'json'
	};

	if (data) {
		options.data = JSON.stringify(data);
		options.contentType = 'application/json';
	}

	return $.ajax(options);
}

/* ==========================================================================
   SPA ROUTING
   ========================================================================== */

function handleRouting() {
	if (!isAuthenticated()) {
		showView('login');
		return;
	}

	showView('app');
	const hash = window.location.hash || '#dashboard';

	$('.sidebar-nav-link').removeClass('active');
	$('.subview').addClass('d-none');

	if (hash === '#dashboard') {
		$('#nav-dashboard').addClass('active');
		$('#subview-dashboard').removeClass('d-none');
		loadDashboard();
	} else if (hash === '#posts') {
		$('#nav-posts').addClass('active');
		$('#subview-posts').removeClass('d-none');
		loadPostsList();
	} else if (hash.startsWith('#posts/new')) {
		$('#nav-posts-new').addClass('active');
		$('#subview-editor').removeClass('d-none');
		setupEditor(null);
	} else if (hash.startsWith('#posts/edit/')) {
		const slug = hash.replace('#posts/edit/', '');
		$('#subview-editor').removeClass('d-none');
		setupEditor(slug);
	} else if (hash === '#settings') {
		$('#nav-settings').addClass('active');
		$('#subview-settings').removeClass('d-none');
		loadSettings();
	} else {
		window.location.hash = '#dashboard';
	}
}

function showView(view) {
	if (view === 'login') {
		$('#view-login').removeClass('d-none');
		$('#view-app').addClass('d-none');
	} else {
		$('#view-login').addClass('d-none');
		$('#view-app').removeClass('d-none');
	}
}

/* ==========================================================================
   DASHBOARD & POSTS LISTING
   ========================================================================== */

function fetchPostsIndex() {
	return $.getJSON('../content/posts.json?t=' + Date.now())
		.then(data => {
			postsIndex = data;
			return data;
		})
		.catch(() => {
			return { posts: [], categories: [] };
		});
}

function loadDashboard() {
	fetchPostsIndex().then(data => {
		const posts = data.posts || [];
		const total = posts.length;
		const published = posts.filter(p => p.published).length;
		const drafts = total - published;
		const categories = (data.categories || []).length;

		$('#metric-total-posts').text(total);
		$('#metric-published-posts').text(published);
		$('#metric-draft-posts').text(drafts);
		$('#metric-categories').text(categories);

		let rowsHtml = '';
		posts.slice(0, 5).forEach(post => {
			rowsHtml += renderPostRow(post);
		});

		$('#table-dashboard-recent').html(rowsHtml || '<tr><td colspan="5" class="text-center text-muted py-3">No posts created yet.</td></tr>');
	});
}

function loadPostsList() {
	fetchPostsIndex().then(data => {
		renderPostsTable(data.posts || []);
	});
}

function renderPostsTable(posts) {
	const search = $('#filter-posts-search').val().toLowerCase();
	const status = $('#filter-posts-status').val();

	const filtered = posts.filter(p => {
		const matchSearch = !search || p.title.toLowerCase().includes(search) || (p.category && p.category.toLowerCase().includes(search));
		const matchStatus = (status === 'ALL') || (status === 'PUBLISHED' && p.published) || (status === 'DRAFT' && !p.published);
		return matchSearch && matchStatus;
	});

	let html = '';
	filtered.forEach(post => {
		html += renderPostRow(post);
	});

	$('#table-posts-list').html(html || '<tr><td colspan="5" class="text-center text-muted py-4">No matching posts found.</td></tr>');
}

function renderPostRow(post) {
	const statusBadge = post.published
		? '<span class="badge-published"><i class="fas fa-check-circle me-1"></i> Published</span>'
		: '<span class="badge-draft"><i class="far fa-edit me-1"></i> Draft</span>';

	return `
		<tr>
			<td class="fw-bold text-main">${escapeHtml(post.title)}</td>
			<td>${statusBadge}</td>
			<td><span class="text-info">${escapeHtml(post.category || 'Uncategorized')}</span></td>
			<td class="text-muted small">${post.date || ''}</td>
			<td class="text-right">
				<a href="#posts/edit/${post.slug}" class="btn btn-sm btn-outline-info me-1" title="Edit Article"><i class="fas fa-pencil-alt"></i> Edit</a>
				<button class="btn btn-sm btn-outline-warning me-1 btn-toggle-publish" data-slug="${post.slug}" data-published="${post.published}" title="Toggle Publish">
					<i class="fas ${post.published ? 'fa-eye-slash' : 'fa-globe'}"></i>
				</button>
				<button class="btn btn-sm btn-outline-danger btn-delete-post" data-slug="${post.slug}" title="Delete Article"><i class="fas fa-trash"></i></button>
			</td>
		</tr>
	`;
}

/* ==========================================================================
   MARKDOWN EDITOR & PREVIEW
   ========================================================================== */

function setupEditor(slug) {
	currentEditingSlug = slug;
	currentPostSha = null;

	if (slug) {
		$('#editor-heading').text('Edit Article');
		showToast('Loading article content from GitHub...', 'info');

		ghRequest('GET', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`)
			.then(fileData => {
				currentPostSha = fileData.sha;
				const decodedContent = decodeBase64Utf8(fileData.content);
				const { meta, content } = parseFrontMatter(decodedContent);

				$('#editor-title').val(meta.title || '');
				$('#editor-slug').val(meta.slug || slug);
				$('#editor-desc').val(meta.description || '');
				$('#editor-category').val(meta.category || '');
				$('#editor-tags').val(Array.isArray(meta.tags) ? meta.tags.join(', ') : (meta.tags || ''));
				$('#editor-cover').val(meta.coverImage || '');
				$('#editor-markdown').val(content || '');

				if (meta.published) {
					$('#btn-publish-post').html('<i class="fas fa-paper-plane me-1"></i> Update Published Post');
				} else {
					$('#btn-publish-post').html('<i class="fas fa-paper-plane me-1"></i> Publish Post');
				}

				updateLivePreview();
			})
			.catch(err => {
				showToast('Failed to load markdown file from repository.', 'danger');
				console.error("Load file error:", err);
			});
	} else {
		$('#editor-heading').text('Create New Article');
		$('#editor-title').val('');
		$('#editor-slug').val('');
		$('#editor-desc').val('');
		$('#editor-category').val('Android');
		$('#editor-tags').val('Android, Kotlin');
		$('#editor-cover').val('images/blog/kotlin-coroutines.svg');
		$('#editor-markdown').val('# New Blog Post\n\nWrite your article content here in Markdown...');
		$('#btn-publish-post').html('<i class="fas fa-paper-plane me-1"></i> Publish Post');

		// Check for auto-saved local draft
		const localDraft = localStorage.getItem(DRAFT_STORAGE_KEY + 'new');
		if (localDraft) {
			try {
				const draftObj = JSON.parse(localDraft);
				if (confirm('An unsaved local draft was found. Would you like to restore it?')) {
					$('#editor-title').val(draftObj.title || '');
					$('#editor-slug').val(draftObj.slug || '');
					$('#editor-desc').val(draftObj.desc || '');
					$('#editor-markdown').val(draftObj.markdown || '');
				}
			} catch (e) {}
		}

		updateLivePreview();
	}
}

function updateLivePreview() {
	const markdown = $('#editor-markdown').val() || '';

	marked.setOptions({
		highlight: function(code, lang) {
			if (lang && hljs.getLanguage(lang)) {
				return hljs.highlight(code, { language: lang }).value;
			}
			return hljs.highlightAuto(code).value;
		},
		breaks: true
	});

	$('#preview-render').html(marked.parse(markdown));

	document.querySelectorAll('#preview-render pre code').forEach((el) => {
		hljs.highlightElement(el);
	});

	// Word & Reading Time Calculation
	const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
	const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
	$('#editor-stats').text(`${wordCount} words \u2022 ${readTimeMinutes} min read`);

	// Auto-save draft locally
	const draftKey = currentEditingSlug ? DRAFT_STORAGE_KEY + currentEditingSlug : DRAFT_STORAGE_KEY + 'new';
	localStorage.setItem(draftKey, JSON.stringify({
		title: $('#editor-title').val(),
		slug: $('#editor-slug').val(),
		desc: $('#editor-desc').val(),
		markdown: markdown,
		timestamp: Date.now()
	}));
}

/* ==========================================================================
   POST COMMIT / PUBLISH ACTIONS
   ========================================================================== */

function savePost(published) {
	const title = $('#editor-title').val().trim();
	let slug = $('#editor-slug').val().trim();

	if (!title) {
		showToast('Article title is required.', 'warning');
		return;
	}

	if (!slug) {
		slug = slugify(title);
		$('#editor-slug').val(slug);
	}

	const description = $('#editor-desc').val().trim();
	const category = $('#editor-category').val().trim() || 'Tutorials';
	const tagsStr = $('#editor-tags').val().trim();
	const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Android'];
	const coverImage = $('#editor-cover').val().trim() || 'images/blog/kotlin-coroutines.svg';
	const markdownContent = $('#editor-markdown').val();
	const dateStr = new Date().toISOString().split('T')[0];

	// Construct YAML Frontmatter
	const yamlFrontMatter =
`---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
description: "${description.replace(/"/g, '\\"')}"
date: "${dateStr}"
updatedAt: "${dateStr}"
author: "${$('#settings-author').val() || 'Mohammad Asif Zafar'}"
category: "${category}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}
coverImage: "${coverImage}"
published: ${published}
---

${markdownContent}`;

	const base64Content = encodeBase64Utf8(yamlFrontMatter);
	const actionText = published ? 'publish' : 'save draft for';
	const commitMessage = `blog: ${published ? 'publish' : 'draft'} ${slug}`;

	showToast(`Committing ${slug} to GitHub...`, 'info');

	// Step 1: Commit Markdown File
	const commitPayload = {
		message: commitMessage,
		content: base64Content
	};
	if (currentPostSha) {
		commitPayload.sha = currentPostSha;
	}

	ghRequest('PUT', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`, commitPayload)
		.then(res => {
			showToast(`Successfully saved ${slug}.md to repository!`, 'success');

			// Step 2: Update posts.json index
			updatePostsIndexInGitHub(slug, {
				title,
				slug,
				description,
				date: dateStr,
				updatedAt: dateStr,
				author: $('#settings-author').val() || 'Mohammad Asif Zafar',
				category,
				tags,
				coverImage,
				published,
				readingTime: `${Math.max(1, Math.ceil(markdownContent.trim().split(/\s+/).length / 200))} min read`
			}).then(() => {
				// Clear local draft cache
				localStorage.removeItem(DRAFT_STORAGE_KEY + (currentEditingSlug || 'new'));
				window.location.hash = '#posts';
			});
		})
		.catch(err => {
			showToast('Failed to commit article to GitHub repository.', 'danger');
			console.error("Commit error:", err);
		});
}

function updatePostsIndexInGitHub(slug, newPostData) {
	return ghRequest('GET', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/posts.json`)
		.then(fileData => {
			const sha = fileData.sha;
			let indexObj = { posts: [], categories: [] };

			try {
				indexObj = JSON.parse(decodeBase64Utf8(fileData.content));
			} catch (e) {}

			let posts = indexObj.posts || [];
			let categories = indexObj.categories || ["Android", "Kotlin", "Jetpack Compose", "Kotlin Multiplatform", "Architecture"];

			const existingIndex = posts.findIndex(p => p.slug === slug);
			if (existingIndex > -1) {
				posts[existingIndex] = newPostData;
			} else {
				posts.unshift(newPostData);
			}

			if (newPostData.category && !categories.includes(newPostData.category)) {
				categories.push(newPostData.category);
			}

			indexObj.posts = posts;
			indexObj.categories = categories;

			const updatedBase64 = encodeBase64Utf8(JSON.stringify(indexObj, null, 2));

			return ghRequest('PUT', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/posts.json`, {
				message: `blog: update posts index for ${slug}`,
				content: updatedBase64,
				sha: sha
			});
		});
}

function deletePost(slug) {
	if (!confirm(`Are you sure you want to permanently delete "${slug}"?`)) {
		return;
	}

	showToast(`Deleting ${slug}.md...`, 'info');

	ghRequest('GET', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`)
		.then(fileData => {
			return ghRequest('DELETE', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`, {
				message: `blog: delete ${slug}`,
				sha: fileData.sha
			});
		})
		.then(() => {
			// Update posts.json
			return ghRequest('GET', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/posts.json`);
		})
		.then(fileData => {
			const sha = fileData.sha;
			let indexObj = JSON.parse(decodeBase64Utf8(fileData.content));
			indexObj.posts = (indexObj.posts || []).filter(p => p.slug !== slug);

			return ghRequest('PUT', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/posts.json`, {
				message: `blog: remove ${slug} from index`,
				content: encodeBase64Utf8(JSON.stringify(indexObj, null, 2)),
				sha: sha
			});
		})
		.then(() => {
			showToast(`Article "${slug}" deleted successfully.`, 'success');
			loadPostsList();
		})
		.catch(err => {
			showToast('Failed to delete post.', 'danger');
			console.error("Delete error:", err);
		});
}

function togglePublishStatus(slug, currentlyPublished) {
	const newStatus = !currentlyPublished;
	showToast(`Updating publish status to ${newStatus ? 'Published' : 'Draft'}...`, 'info');

	ghRequest('GET', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`)
		.then(fileData => {
			const sha = fileData.sha;
			const decoded = decodeBase64Utf8(fileData.content);
			const { meta, content } = parseFrontMatter(decoded);

			meta.published = newStatus;

			// Re-serialize frontmatter
			const updatedYaml =
`---
title: "${(meta.title || slug).replace(/"/g, '\\"')}"
slug: "${slug}"
description: "${(meta.description || '').replace(/"/g, '\\"')}"
date: "${meta.date || ''}"
updatedAt: "${new Date().toISOString().split('T')[0]}"
author: "${meta.author || 'Mohammad Asif Zafar'}"
category: "${meta.category || 'Android'}"
tags:
${(meta.tags || []).map(t => `  - ${t}`).join('\n')}
coverImage: "${meta.coverImage || ''}"
published: ${newStatus}
---

${content}`;

			return ghRequest('PUT', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/content/blog/${slug}.md`, {
				message: `blog: ${newStatus ? 'publish' : 'unpublish'} ${slug}`,
				content: encodeBase64Utf8(updatedYaml),
				sha: sha
			});
		})
		.then(() => {
			return updatePostsIndexInGitHub(slug, {
				title: slug,
				slug: slug,
				published: newStatus
			});
		})
		.then(() => {
			showToast(`Status updated successfully!`, 'success');
			loadPostsList();
		});
}

/* ==========================================================================
   IMAGE UPLOAD TO GITHUB REPOSITORY
   ========================================================================== */

function uploadImageToGitHub(file) {
	const reader = new FileReader();
	reader.onload = function(e) {
		const base64Data = e.target.result.split(',')[1];
		const filename = file.name.toLowerCase().replace(/[^a-z0-9\.]/g, '-');
		const path = `images/blog/${filename}`;

		showToast(`Uploading image ${filename}...`, 'info');

		ghRequest('PUT', `/repos/${currentAuth.owner}/${currentAuth.repo}/contents/${path}`, {
			message: `blog: upload image ${filename}`,
			content: base64Data
		})
		.then(res => {
			showToast(`Image uploaded to ${path}`, 'success');
			$('#editor-cover').val(path);
		})
		.catch(err => {
			showToast('Failed to upload image. Image may already exist or token lacks permission.', 'danger');
			console.error("Image upload error:", err);
		});
	};
	reader.readAsDataURL(file);
}

/* ==========================================================================
   EVENT HANDLERS & HELPERS
   ========================================================================== */

function setupEventHandlers() {
	$('#form-login').on('submit', function(e) {
		e.preventDefault();
		const owner = $('#input-owner').val().trim();
		const repo = $('#input-repo').val().trim();
		const token = $('#input-token').val().trim();
		login(owner, repo, token);
	});

	$('#btn-logout').on('click', logout);

	$('#filter-posts-search, #filter-posts-status').on('input change', function() {
		loadPostsList();
	});

	$('#editor-title').on('input', function() {
		if (!currentEditingSlug) {
			$('#editor-slug').val(slugify($(this).val()));
		}
	});

	$('#editor-markdown').on('input', function() {
		updateLivePreview();
	});

	// Toolbar buttons
	$('.toolbar-btn').on('click', function() {
		const action = $(this).data('action');
		insertMarkdownSyntax(action);
	});

	$('#btn-save-draft').on('click', function() {
		savePost(false);
	});

	$('#btn-publish-post').on('click', function() {
		savePost(true);
	});

	$(document).on('click', '.btn-delete-post', function() {
		const slug = $(this).data('slug');
		deletePost(slug);
	});

	$(document).on('click', '.btn-toggle-publish', function() {
		const slug = $(this).data('slug');
		const published = $(this).data('published') === true || $(this).data('published') === 'true';
		togglePublishStatus(slug, published);
	});

	$('#btn-upload-cover').on('click', function() {
		$('#file-cover-input').click();
	});

	$('#file-cover-input').on('change', function() {
		if (this.files && this.files[0]) {
			uploadImageToGitHub(this.files[0]);
		}
	});

	$('#form-settings').on('submit', function(e) {
		e.preventDefault();
		currentAuth.owner = $('#settings-owner').val().trim();
		currentAuth.repo = $('#settings-repo').val().trim();
		sessionStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(currentAuth));
		showToast('Settings saved!', 'success');
	});
}

function loadSettings() {
	$('#settings-owner').val(currentAuth.owner);
	$('#settings-repo').val(currentAuth.repo);
}

function insertMarkdownSyntax(action) {
	const textarea = document.getElementById('editor-markdown');
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selection = textarea.value.substring(start, end);

	let replacement = '';
	switch (action) {
		case 'h1': replacement = `# ${selection || 'Heading 1'}`; break;
		case 'h2': replacement = `## ${selection || 'Heading 2'}`; break;
		case 'bold': replacement = `**${selection || 'bold text'}**`; break;
		case 'italic': replacement = `*${selection || 'italic text'}*`; break;
		case 'link': replacement = `[${selection || 'link text'}](https://example.com)`; break;
		case 'code': replacement = `\`\`\`kotlin\n${selection || '// code here'}\n\`\`\``; break;
		case 'quote': replacement = `> ${selection || 'Blockquote text'}`; break;
		case 'ul': replacement = `- ${selection || 'List item'}`; break;
		case 'ol': replacement = `1. ${selection || 'List item'}`; break;
		case 'hr': replacement = `\n---\n`; break;
	}

	textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
	textarea.focus();
	updateLivePreview();
}

function slugify(text) {
	return text.toString().toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
}

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

function encodeBase64Utf8(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64Utf8(str) {
	return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
}

function escapeHtml(str) {
	return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
	const id = 'toast-' + Date.now();
	const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-primary';

	const toastHtml = `
		<div id="${id}" class="toast align-items-center text-white ${bgClass} border-0 show mb-2" role="alert" aria-live="assertive" aria-atomic="true">
			<div class="d-flex">
				<div class="toast-body">${message}</div>
				<button type="button" class="ml-auto mr-2 close text-white" data-dismiss="toast" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
		</div>
	`;

	$('#toast-container').append(toastHtml);
	setTimeout(() => {
		$(`#${id}`).fadeOut(300, function() { $(this).remove(); });
	}, 4000);
}
