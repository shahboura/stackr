type SaveHandle = {
	createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
};

type PickerWindow = Window & {
	showSaveFilePicker?: (options: { suggestedName?: string }) => Promise<SaveHandle>;
};

function save(name: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = name;
	anchor.rel = 'noopener';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Saves exactly `text` — no trimming, no HTML entities, no BOM.
 * Chrome/Edge drop the leading dot from a Blob download name, so `.env` asks
 * the user for a location instead; other browsers get the normal download.
 */
export async function downloadFile(name: string, text: string): Promise<void> {
	const picker = (window as PickerWindow).showSaveFilePicker;
	if (name === '.env' && picker) {
		try {
			const handle = await picker({ suggestedName: '.env' });
			const writable = await handle.createWritable();
			await writable.write(text);
			await writable.close();
			return;
		} catch (cause) {
			if (cause instanceof DOMException && cause.name === 'AbortError') return;
		}
	}

	save(name, new Blob([text], { type: 'text/plain;charset=utf-8' }));
}
