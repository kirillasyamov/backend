import type { FileUploadedEvent } from '../../interfaces';

export type UploadEventCallback = (event: FileUploadedEvent) => Promise<void>;

export interface IListenEvents {
	onUpload(listener: UploadEventCallback): void;
}

export const LISTEN_EVENTS = Symbol('LISTEN_EVENTS');
