/** Display-only redaction for .env previews; copy/download still use the real text. */
export function redactEnv(env: string, secretNames: string[]): string {
	if (secretNames.length === 0) return env;
	const names = new Set(secretNames);
	return env
		.split('\n')
		.map((line) => {
			const match = /^([A-Z][A-Z0-9_]*)=/.exec(line);
			return match && names.has(match[1]) ? `${match[1]}=••••••••••••` : line;
		})
		.join('\n');
}
