import type { Service } from '../catalog/parse';

export type PortField = {
	varName: string;
	service: Service;
	label: string;
	defaultPort: number;
};

/** Human name for ${SONARR_PORT} and ${QBITTORRENT_WEBUI_PORT}. */
export function portLabel(service: Service, varName: string): string {
	const prefix = `${service.slug.toUpperCase().replace(/-/g, '_')}_`;
	const rest = varName.startsWith(prefix) ? varName.slice(prefix.length) : varName;
	const name = rest.replace(/_PORT$/, '');
	if (name === '' || name === 'PORT' || name === 'WEBUI') return 'Web UI';
	if (name === 'TORRENTING' || name === 'TORRENT') return 'Torrent';
	return name.toLowerCase().replace(/_/g, ' ');
}

export function portFields(services: Service[]): PortField[] {
	return services.flatMap((service) =>
		service.portVars.map((varName) => ({
			varName,
			service,
			label: portLabel(service, varName),
			defaultPort: service.portDefaults[varName]
		}))
	);
}

export const portValue = (field: PortField, ports: Record<string, number>): number =>
	ports[field.varName] ?? field.defaultPort;

export type PortConflict = { port: number; fields: PortField[] };

export function findConflicts(services: Service[], ports: Record<string, number>): PortConflict[] {
	const byPort = new Map<number, PortField[]>();
	for (const field of portFields(services)) {
		const value = portValue(field, ports);
		const list = byPort.get(value) ?? [];
		list.push(field);
		byPort.set(value, list);
	}
	return [...byPort.entries()]
		.filter(([, fields]) => fields.length > 1)
		.map(([port, fields]) => ({ port, fields }))
		.sort((a, b) => a.port - b.port);
}

/** First free port at or after `start`, wrapping to 1024. */
export function suggestPort(start: number, used: Set<number>): number {
	for (let port = start + 1; port <= 65535; port++) {
		if (!used.has(port)) return port;
	}
	for (let port = 1024; port < start; port++) {
		if (!used.has(port)) return port;
	}
	throw new Error('no free port');
}

export function usedPorts(services: Service[], ports: Record<string, number>): Set<number> {
	return new Set(portFields(services).map((field) => portValue(field, ports)));
}

export function isValidPort(value: number): boolean {
	return Number.isInteger(value) && value >= 1 && value <= 65535;
}
