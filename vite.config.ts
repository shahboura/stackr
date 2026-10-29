import { join } from 'node:path';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { loadCatalogFromDisk } from './src/lib/catalog/node.ts';

const CATALOG_ID = 'virtual:stackr-catalog';
const RESOLVED_CATALOG_ID = `\0${CATALOG_ID}`;

/** Parse catalog at build time so zod + yaml never reach the client bundle. */
function catalogPlugin(): Plugin {
	let servicesDir = '';
	return {
		name: 'stackr-catalog',
		configResolved(config) {
			servicesDir = join(config.root, 'catalog/services');
		},
		resolveId(id) {
			if (id === CATALOG_ID) return RESOLVED_CATALOG_ID;
		},
		load(id) {
			if (id !== RESOLVED_CATALOG_ID) return;
			const catalog = loadCatalogFromDisk(servicesDir);
			for (const service of catalog) {
				this.addWatchFile(join(servicesDir, service.slug, 'service.md'));
				this.addWatchFile(join(servicesDir, service.slug, 'compose.yml'));
			}
			return `export const catalog = ${JSON.stringify(catalog)};`;
		}
	};
}

export default defineConfig({
	plugins: [
		catalogPlugin(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ pages: 'dist', assets: 'dist', fallback: undefined }),
			// The wizard keeps selection in #s=… ; that is app state, not an anchor.
			prerender: {
				handleMissingId: ({ id }) => {
					if (!id.startsWith('s=')) throw new Error(`missing anchor #${id}`);
				}
			}
		})
	]
});
