export type HostPreset = {
	id: string;
	name: string;
	/** Where the media root normally lives on this host. */
	dataDir: string;
	puid: string;
	pgid: string;
	umask: string;
	consequence: string;
	cost: string;
	/** Linux/NAS runs Docker directly; Docker Desktop shares folders through a VM. */
	platform: 'linux' | 'desktop';
	shell: 'posix' | 'powershell';
	/** The stat command that prints a filesystem id, when a host check is meaningful. */
	stat: 'gnu' | 'bsd' | null;
	/** A hardlink limitation the user must see before downloading. */
	caution?: string;
};

export const HOSTS: HostPreset[] = [
	{
		id: 'linux',
		name: 'Linux',
		dataDir: '/srv/media',
		puid: '1000',
		pgid: '1000',
		umask: '002',
		consequence: 'The stack writes to /srv/media and runs as your login user.',
		cost: 'You need to create /srv/media and give it to that user once.',
		platform: 'linux',
		shell: 'posix',
		stat: 'gnu'
	},
	{
		id: 'unraid',
		name: 'Unraid',
		dataDir: '/mnt/user/media',
		puid: '99',
		pgid: '100',
		umask: '002',
		consequence: 'Paths live under /mnt/user and match Unraid’s share layout.',
		cost: 'Keep the folder on one pool; a share that spans disks breaks hardlinks.',
		platform: 'linux',
		shell: 'posix',
		stat: 'gnu'
	},
	{
		id: 'synology',
		name: 'Synology',
		dataDir: '/volume1/media',
		puid: '1026',
		pgid: '100',
		umask: '002',
		consequence: 'Paths use /volume1 and the first DSM user’s IDs.',
		cost: 'Confirm your UID with `id` — DSM does not always start at 1026.',
		platform: 'linux',
		shell: 'posix',
		stat: 'gnu'
	},
	{
		id: 'windows',
		name: 'Windows',
		dataDir: 'C:/Users/Public/media',
		puid: '1000',
		pgid: '1000',
		umask: '002',
		consequence: 'Docker Desktop shares C:/Users/Public/media into a Linux VM.',
		cost: 'Experimental: the stack runs, but imports may copy instead of hardlink through the VM.',
		platform: 'desktop',
		shell: 'powershell',
		stat: null,
		caution:
			'Hardlinks are not guaranteed through the VM. Keep the folder on one local disk — network shares and OneDrive folders break them. Run compose from PowerShell on this PC, not from WSL. Use a Linux or NAS host if disk use matters.'
	},
	{
		id: 'macos',
		name: 'macOS',
		dataDir: '/Users/Shared/media',
		puid: '1000',
		pgid: '1000',
		umask: '002',
		consequence: 'Docker Desktop shares /Users/Shared/media into a Linux VM.',
		cost: 'Experimental: the stack runs, but imports may copy instead of hardlink through the VM.',
		platform: 'desktop',
		shell: 'posix',
		stat: null,
		caution:
			'Hardlinks are not guaranteed through the VM. Keep the folder on one local disk — network shares break them. Use a Linux or NAS host if disk use matters.'
	}
];

export const UMASK_OPTIONS = [
	{
		value: '002',
		name: '002 — group can write',
		consequence: 'Every arr app and Jellyfin can rename and replace the same files.',
		cost: 'Slightly broader permissions inside that group.'
	},
	{
		value: '022',
		name: '022 — only the owner writes',
		consequence: 'Fine when every container runs as the same user.',
		cost: 'A second user or group cannot clean up files created by another app.'
	}
];

export const LAYOUTS = [
	{
		id: 'shared',
		name: 'One /data mount',
		consequence: 'Sonarr, Radarr and qBittorrent see the same filesystem, so hardlinks work.',
		cost: 'All of it must fit on one disk or pool.'
	},
	{
		id: 'split',
		name: 'Separate downloads and media mounts',
		consequence: 'Every import becomes a full copy instead of a hardlink.',
		cost: 'Double disk use and slow imports. Disabled on purpose.'
	}
];
