import { describe, expect, test } from 'bun:test';
import { inspect } from '../scripts/check-images';

const arm64Manifest = JSON.stringify({
	manifests: [{ platform: { architecture: 'amd64' } }, { platform: { architecture: 'arm64' } }]
});

const fail = (stderr: string) => () => {
	throw Object.assign(new Error(`Command failed: docker manifest inspect x`), { stderr });
};

describe('check-images inspect', () => {
	test('retries a transient registry failure', () => {
		let calls = 0;
		const result = inspect('img', {
			delayMs: 0,
			run: () => {
				calls += 1;
				if (calls < 3) fail('toomanyrequests: rate limited')();
				return arm64Manifest;
			}
		});

		expect(calls).toBe(3);
		expect(result).toEqual({ image: 'img', resolves: true, arm64: true });
	});

	test('gives up after three attempts and keeps the registry reason', () => {
		let calls = 0;
		const result = inspect('img', {
			delayMs: 0,
			run: () => {
				calls += 1;
				fail('denied: requested access to the resource is denied\n')();
			}
		});

		expect(calls).toBe(3);
		expect(result.resolves).toBe(false);
		expect(result.error).toBe('denied: requested access to the resource is denied');
	});

	test('flags a manifest without arm64', () => {
		const result = inspect('img', {
			delayMs: 0,
			run: () => JSON.stringify({ manifests: [{ platform: { architecture: 'amd64' } }] })
		});

		expect(result).toEqual({ image: 'img', resolves: true, arm64: false });
	});
});
