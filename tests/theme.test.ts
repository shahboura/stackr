import { describe, expect, test } from 'bun:test';
import { nextTheme } from '../src/lib/ui/theme';

describe('theme cycle', () => {
	test('system -> dark -> light -> system', () => {
		expect(nextTheme('system')).toBe('dark');
		expect(nextTheme('dark')).toBe('light');
		expect(nextTheme('light')).toBe('system');
	});
});
