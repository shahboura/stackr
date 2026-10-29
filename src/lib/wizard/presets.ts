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
		cost: 'You need to create /srv/media and give it to that user once.'
	},
	{
		id: 'unraid',
		name: 'Unraid',
		dataDir: '/mnt/user/media',
		puid: '99',
		pgid: '100',
		umask: '002',
		consequence: 'Paths live under /mnt/user and match Unraid’s share layout.',
		cost: 'Keep the folder on one pool; a share that spans disks breaks hardlinks.'
	},
	{
		id: 'synology',
		name: 'Synology',
		dataDir: '/volume1/media',
		puid: '1026',
		pgid: '100',
		umask: '002',
		consequence: 'Paths use /volume1 and the first DSM user’s IDs.',
		cost: 'Confirm your UID with `id` — DSM does not always start at 1026.'
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
