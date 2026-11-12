import type { FileUploadedEvent } from '../interfaces';
import { toFieldsObject } from './array-to-object';

export function toFileUploadedEvent(fields: string[]): FileUploadedEvent | null {
	const object = toFieldsObject(fields);

	const directKey = object.Key?.trim();
	if (directKey) {
		return { fileKey: decodeURIComponent(directKey) };
	}

	const recordsField = object.Records;
	if (recordsField) {
		try {
			const records = JSON.parse(recordsField) as { s3?: { object?: { key?: string } } }[];
			for (const record of records) {
				const recordKey = record.s3?.object?.key;
				if (recordKey) return { fileKey: decodeURIComponent(recordKey) };
			}
		} catch {
			return null;
		}
	}

	return null;
}
