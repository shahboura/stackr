import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/**
 * service.md repeats its title for the repository reader. The page already has
 * an h1, so drop the leading one to avoid two h1s in the prerendered HTML.
 * service.md is repo content, not user input; no sanitizer needed here.
 */
export const renderMarkdown = (source: string): string =>
	marked.parse(source.replace(/^\s*#\s+[^\n]*\n+/, ''), { async: false }) as string;
