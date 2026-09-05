export function toFieldsObject(fields: string[]): Record<string, string> {
	const object: Record<string, string> = {};
	for (let i = 0; i < fields.length; i += 2) {
		const key = fields[i];
		const value = fields[i + 1];
		if (key === undefined || value === undefined) continue;
		object[key] = value;
	}
	return object;
}
