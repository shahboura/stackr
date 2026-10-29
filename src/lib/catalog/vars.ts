/**
 * Variables every service may use without declaring them. Anything else in a
 * compose fragment must come from `generators` or be a `*_PORT` host port.
 */
export type GlobalVar = {
	defaultValue: string;
	kind: 'text' | 'number' | 'octal' | 'path';
};

export const GLOBAL_VARS: Record<string, GlobalVar> = {
	TZ: {
		defaultValue: 'Etc/UTC',
		kind: 'text'
	},
	PUID: {
		defaultValue: '1000',
		kind: 'number'
	},
	PGID: {
		defaultValue: '1000',
		kind: 'number'
	},
	UMASK: {
		defaultValue: '002',
		kind: 'octal'
	},
	DATA_DIR: {
		defaultValue: '/srv/media',
		kind: 'path'
	}
};

export const isGlobalVar = (name: string): boolean =>
	Object.prototype.hasOwnProperty.call(GLOBAL_VARS, name);
