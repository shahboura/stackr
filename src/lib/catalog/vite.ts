import { catalog } from 'virtual:stackr-catalog';
import type { Service } from './parse';

export { catalog };

export const serviceBySlug = (slug: string): Service | undefined =>
	catalog.find((service) => service.slug === slug);
