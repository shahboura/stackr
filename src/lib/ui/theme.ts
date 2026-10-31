export type Theme = 'system' | 'light' | 'dark';

const NEXT: Record<Theme, Theme> = {
	system: 'dark',
	dark: 'light',
	light: 'system'
};

/** One click per mode: system -> dark -> light -> system. */
export const nextTheme = (theme: Theme): Theme => NEXT[theme];
