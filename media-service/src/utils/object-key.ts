export interface PurposeProfile {
	prefix: string;
	allowedMimes: readonly string[];
	maxSizeBytes: number;
}

const MEGABYTE = 1024 * 1024;

export const PURPOSE_PROFILES = {
	avatar: {
		prefix: 'avatar',
		allowedMimes: ['image/jpeg', 'image/png'],
		maxSizeBytes: 10 * MEGABYTE,
	},
} as const satisfies Record<string, PurposeProfile>;

export type PurposeName = keyof typeof PURPOSE_PROFILES;

export const isPurpose = (value: string): value is PurposeName => Object.hasOwn(PURPOSE_PROFILES, value);

export const getPurposeProfile = (purpose: PurposeName): PurposeProfile => PURPOSE_PROFILES[purpose];

export const getPurposeNames = (): PurposeName[] => Object.keys(PURPOSE_PROFILES) as PurposeName[];

export const findPurposeByPrefix = (prefix: string): PurposeName | undefined => getPurposeNames().find(name => PURPOSE_PROFILES[name].prefix === prefix);

export const getAllowedMimesNamespace = (allowedMimes: readonly string[]): string => {
	const first = allowedMimes[0] ?? '';
	const namespace = first.slice(0, first.indexOf('/') + 1);
	if (!namespace || !allowedMimes.every(mime => mime.startsWith(namespace))) {
		throw new Error(`Allowed mimes [${allowedMimes.join(', ')}] do not share a common type namespace`);
	}
	return namespace;
};

export interface ParsedObjectKey {
	prefix: string;
	ownerAccountId: string;
	fileId: string;
}

export const parseObjectKey = (key: string): ParsedObjectKey | null => {
	const segments = key.split('/');
	if (segments.length !== 3 || segments.some(segment => segment.length === 0)) return null;
	return { prefix: segments[0] ?? '', ownerAccountId: segments[1] ?? '', fileId: segments[2] ?? '' };
};

export const buildObjectKey = (profile: PurposeProfile, ownerAccountId: string, fileId: string): string => `${profile.prefix}/${ownerAccountId}/${fileId}`;

export const ownsObjectKey = (key: string, ownerAccountId: string): boolean => {
	const parsed = parseObjectKey(key);
	return parsed !== null && parsed.ownerAccountId === ownerAccountId;
};
