import type { Service } from './parse';

/** Everything the catalog search can match. Category is metadata, not a filter. */
export function serviceMatches(service: Service, query: string): boolean {
	const needle = query.trim().toLowerCase();
	if (!needle) return true;
	const haystack = [
		service.name,
		service.slug,
		service.summary,
		service.category,
		service.ram,
		...service.tags,
		...service.ports.map(String),
		...service.deps
	]
		.join(' ')
		.toLowerCase();
	return haystack.includes(needle);
}
