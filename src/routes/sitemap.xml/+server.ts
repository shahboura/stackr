import { catalog } from '#lib/catalog/vite';
import { SITE_URL } from '#lib/site';

export const prerender = true;

export const GET = (): Response => {
	const paths = ['/', ...catalog.map((service) => `/services/${service.slug}`)];
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...paths.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`),
		'</urlset>',
		''
	].join('\n');

	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
