import { describe, expect, test } from 'bun:test';
import { HOSTS } from '../src/lib/wizard/presets';
import { hardlinkStatus, setupCommand, statCommand } from '../src/lib/wizard/host';

const host = (id: string) => {
	const found = HOSTS.find((candidate) => candidate.id === id);
	if (!found) throw new Error(`missing host ${id}`);
	return found;
};

describe('host presets', () => {
	test('Linux creates the folders and fixes ownership', () => {
		const command = setupCommand(host('linux'), ['/srv/media/appdata'], '/srv/media', '1000', '1000');
		expect(command).toContain("mkdir -p '/srv/media/appdata'");
		expect(command).toContain("sudo chown -R 1000:1000 '/srv/media'");
	});

	test('macOS creates the folders without a host chown', () => {
		const command = setupCommand(
			host('macos'),
			['/Users/Shared/media/appdata'],
			'/Users/Shared/media',
			'1000',
			'1000'
		);
		expect(command).toContain("mkdir -p '/Users/Shared/media/appdata'");
		expect(command).not.toContain('chown');
	});

	test('Windows uses PowerShell and no host chown', () => {
		const command = setupCommand(
			host('windows'),
			['C:/Users/Public/media/appdata'],
			'C:/Users/Public/media',
			'1000',
			'1000'
		);
		expect(command).toBe(
			"New-Item -ItemType Directory -Force -LiteralPath 'C:/Users/Public/media/appdata' | Out-Null"
		);
		expect(command).not.toContain('chown');
	});

	test('PowerShell doubles apostrophes and treats paths literally', () => {
		const command = setupCommand(
			host('windows'),
			["C:/Users/O'Brien/media/[archive]"],
			"C:/Users/O'Brien/media",
			'1000',
			'1000'
		);
		expect(command).toContain("-LiteralPath 'C:/Users/O''Brien/media/[archive]'");
	});

	test('desktop hosts do not pretend a host stat check proves hardlinks', () => {
		expect(statCommand(host('linux'), '/srv/media')).toBe(
			"stat -c %d '/srv/media/downloads' '/srv/media/media'"
		);
		expect(statCommand(host('macos'), '/Users/Shared/media')).toBeNull();
		expect(statCommand(host('windows'), 'C:/Users/Public/media')).toBeNull();
	});

	test('hardlink status names the Docker Desktop limitation', () => {
		expect(hardlinkStatus(host('linux'), true)).toBe('one mount');
		expect(hardlinkStatus(host('windows'), true)).toBe('may copy');
		expect(hardlinkStatus(host('macos'), true)).toBe('may copy');
		expect(hardlinkStatus(host('windows'), false)).toBe('not used');
	});
});
