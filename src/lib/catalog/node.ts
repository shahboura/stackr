import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, type Service } from './parse.ts';

const DEFAULT_ROOT = fileURLToPath(new URL('../../../catalog/services/', import.meta.url));

/** Node-only loader for tests and CI scripts. Never imported by the browser. */
export function loadCatalogFromDisk(root = DEFAULT_ROOT): Service[] {
	const dirs = readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	return buildCatalog(
		dirs.map((slug) => ({
			slug,
			md: readFileSync(join(root, slug, 'service.md'), 'utf8'),
			compose: readFileSync(join(root, slug, 'compose.yml'), 'utf8')
		}))
	);
}
