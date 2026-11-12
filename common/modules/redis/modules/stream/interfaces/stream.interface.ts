export interface StreamEntry {
	id: string;
	fields: string[];
}

export interface ReadGroupOptions {
	count?: number;
	blockMs?: number;
}

export interface AutoClaimResult {
	entries: StreamEntry[];
	nextStart: string;
}

export interface AutoClaimOptions {
	count?: number;
	start?: string;
}
