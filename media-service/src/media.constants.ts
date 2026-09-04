export const STATUS_TAG = 'status';
export const STATUS_TAG_VALUES = {
	CONFIRMED: 'confirmed',
	REJECTED: 'rejected',
} as const;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const HEALTH_STATUS_SERVING = 1;
export const SIGNATURE_SNIFF_BYTES = 512;
export const MIN_URL_TTL_SECONDS = 60;
export const LIST_MAX_KEYS = 1000;

export const MINIO_STREAM = 'minio-events';
export const CONSUMER_GROUP = 'media-verify';
export const CONSUMER_NAME = 'media-consumer-1';
