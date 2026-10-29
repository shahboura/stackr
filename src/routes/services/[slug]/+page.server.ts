import { error } from '@sveltejs/kit';
import { catalog, serviceBySlug } from '#lib/catalog/vite';
import { renderMarkdown } from '#lib/catalog/markdown.server';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => catalog.map((service) => ({ slug: service.slug }));

export const load: PageServerLoad = ({ params }) => {
	const service = serviceBySlug(params.slug);
	if (!service) error(404, 'Service not found');

	const deps = service.deps.flatMap((slug) => {
		const dep = serviceBySlug(slug);
		return dep ? [{ slug: dep.slug, name: dep.name, summary: dep.summary }] : [];
	});

	return { service, html: renderMarkdown(service.body), deps };
};
