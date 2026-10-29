/**
 * Cryptographic secret generation. WebCrypto only: no Math.random, no hashing
 * (argon2/bcrypt are deferred until a service actually needs a password hash).
 */
export const SECRET_KINDS = [
	'hex32',
	'hex64',
	'base64_32',
	'base64url_32',
	'alnum32',
	'uuid'
] as const;

export type SecretKind = (typeof SECRET_KINDS)[number];

/** Why each format, shown as the comment above the value in .env. */
export const SECRET_NOTES: Record<SecretKind, string> = {
	hex32: '32 hex characters — safe in .env, URLs, and HTTP headers.',
	hex64: '64 hex characters — safe in .env, URLs, and HTTP headers.',
	base64_32: '32 random bytes as unpadded base64 — for OAuth-style clients.',
	base64url_32: '32 random bytes as base64url — safe in cookies and query strings.',
	alnum32: '32 letters and digits — no / + $, so password fields and .env stay intact.',
	uuid: 'A random UUID — for instance IDs and client identifiers.'
};

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return bytes;
}

function hex(length: number): string {
	return Array.from(randomBytes(length), (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64(bytes: Uint8Array, url: boolean): string {
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	const encoded = btoa(binary).replace(/=+$/, '');
	return url ? encoded.replace(/\+/g, '-').replace(/\//g, '_') : encoded;
}

/** Unbiased alphanumeric string: 248 = 62 × 4, reject the top 8 byte values. */
function alnum(length: number): string {
	let out = '';
	while (out.length < length) {
		for (const b of randomBytes(length)) {
			if (b >= 248) continue;
			out += ALNUM[b % ALNUM.length];
			if (out.length === length) break;
		}
	}
	return out;
}

export function generateSecret(kind: SecretKind): string {
	switch (kind) {
		case 'hex32':
			return hex(16);
		case 'hex64':
			return hex(32);
		case 'base64_32':
			return base64(randomBytes(32), false);
		case 'base64url_32':
			return base64(randomBytes(32), true);
		case 'alnum32':
			return alnum(32);
		case 'uuid':
			return crypto.randomUUID();
	}
}

const PATTERNS: Record<SecretKind, RegExp> = {
	hex32: /^[0-9a-f]{32}$/,
	hex64: /^[0-9a-f]{64}$/,
	base64_32: /^[A-Za-z0-9+/]{43}$/,
	base64url_32: /^[A-Za-z0-9_-]{43}$/,
	alnum32: /^[A-Za-z0-9]{32}$/,
	uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

export const isSecret = (kind: SecretKind, value: string): boolean => PATTERNS[kind].test(value);
