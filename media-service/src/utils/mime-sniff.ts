interface MimeSignature {
	mime: string;
	bytes: readonly number[];
	offset?: number;
}

const MIME_SIGNATURES: readonly MimeSignature[] = [
	{ mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
	{ mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
	{ mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
	{ mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
	{ mime: 'video/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3] },
	{ mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

export const sniffMime = (head: Uint8Array): string | null => {
	for (const signature of MIME_SIGNATURES) {
		const offset = signature.offset ?? 0;
		if (head.length < offset + signature.bytes.length) continue;
		const matches = signature.bytes.every((byte, index) => head[offset + index] === byte);
		if (matches) return signature.mime;
	}
	return null;
};
