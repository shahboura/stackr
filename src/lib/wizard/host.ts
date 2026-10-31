import type { HostPreset } from './presets';
import { shellQuote } from './state';

/** PowerShell single quotes double the apostrophe; backslashes stay literal. */
const powershellQuote = (value: string): string => `'${value.replace(/'/g, "''")}'`;

/** Create the bind-mount folders with the shell the host actually has. */
export function setupCommand(
	host: HostPreset,
	folders: string[],
	dataDir: string,
	puid: string,
	pgid: string
): string {
	if (host.shell === 'powershell') {
		return `New-Item -ItemType Directory -Force -LiteralPath ${folders.map(powershellQuote).join(', ')} | Out-Null`;
	}
	const lines = [`mkdir -p ${folders.map(shellQuote).join(' ')}`];
	if (host.platform === 'linux') {
		lines.push(`sudo chown -R ${puid}:${pgid} ${shellQuote(dataDir)}`);
	}
	return lines.join('\n');
}

/** Empty when the host check would not prove anything inside Docker Desktop. */
export function statCommand(host: HostPreset, dataDir: string): string | null {
	if (host.platform === 'desktop' || !host.stat) return null;
	const flag = host.stat === 'gnu' ? '-c' : '-f';
	return `stat ${flag} %d ${shellQuote(`${dataDir}/downloads`)} ${shellQuote(`${dataDir}/media`)}`;
}

export const hardlinkStatus = (host: HostPreset, sharedMount: boolean): string => {
	if (!sharedMount) return 'not used';
	return host.platform === 'desktop' ? 'may copy' : 'one mount';
};
