import { loadCatalogFromDisk } from '../../src/lib/catalog/node';
import type { Service } from '../../src/lib/catalog/parse';

/** Same files the Vite loader sees, read from disk for Node-side tests. */
export const loadCatalog = loadCatalogFromDisk;

export function bySlug(services: Service[], ...slugs: string[]): Service[] {
	return slugs.map((slug) => {
		const service = services.find((candidate) => candidate.slug === slug);
		if (!service) throw new Error(`missing service ${slug}`);
		return service;
	});
}

export const BASE_VALUES = {
	TZ: 'Etc/UTC',
	PUID: '1000',
	PGID: '1000',
	UMASK: '002',
	DATA_DIR: '/srv/media'
};
