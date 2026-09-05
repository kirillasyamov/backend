import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LISTEN_EVENTS, type IListenEvents } from '../s3-events-listening';
import { FILE_HANDLER, type IFileHandler } from '../../interfaces';

const SKIP_REASONS = new Set(['unknown purpose', 'object not found']);

@Injectable()
export class UploadEventProcessor implements OnModuleInit {
	private readonly logger = new Logger(UploadEventProcessor.name);

	constructor(
		@Inject(LISTEN_EVENTS) private readonly listen: IListenEvents,
		@Inject(FILE_HANDLER) private readonly handler: IFileHandler,
	) {}

	onModuleInit(): void {
		this.listen.onUpload(async ({ fileKey }) => this.handle(fileKey));
	}

	private async handle(fileKey: string): Promise<void> {
		const result = await this.handler.verifyUpload({ key: fileKey });

		if (result.reason !== undefined && SKIP_REASONS.has(result.reason)) {
			this.logger.log(`Upload event received, skipping verification: key=${fileKey} reason=${result.reason}`);
			return;
		}

		this.logger.log(`Upload event received: key=${fileKey} confirmed=${String(result.confirmed)}${result.reason !== undefined ? ` reason=${result.reason}` : ''}`);
	}
}
