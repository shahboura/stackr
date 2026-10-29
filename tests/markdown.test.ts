import { describe, expect, test } from 'bun:test';
import { renderMarkdown } from '../src/lib/catalog/markdown.server';

describe('service markdown', () => {
	test('drops the leading repository title so the page has one h1', () => {
		const html = renderMarkdown('# Jellyfin\n\nProse about Jellyfin.');
		expect(html).not.toContain('<h1');
		expect(html).toContain('Prose about Jellyfin.');
	});

	test('keeps later headings and code fences', () => {
		const html = renderMarkdown('# Title\n\n## Setup\n\n```bash\ndocker compose up -d\n```');
		expect(html).toContain('<h2>Setup</h2>');
		expect(html).toContain('docker compose up -d');
	});
});
