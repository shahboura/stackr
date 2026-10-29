const encoder = new TextEncoder();

const byteLength = (text: string): number => encoder.encode(text).byteLength;

/** "8.4 KB" — bytes below 1 KB stay exact. */
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} KB`;
}

/** Content lines: the trailing newline most generators emit is not a line. */
const lineCount = (text: string): number => text.replace(/\n$/, '').split('\n').length;

export function fileMeta(text: string): string {
	const lines = lineCount(text);
	return `${lines} line${lines === 1 ? '' : 's'} · ${formatBytes(byteLength(text))}`;
}
