import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AvatarStatus, USER_SERVICE_NAME, type UserServiceClient } from '@kirillasyamov/common/contracts/generated/user';
import { LISTEN_EVENTS, type IListenEvents } from '../s3-events-listening';
import { USER_PACKAGE } from '../../media.constants';
import { FILE_HANDLER, type IFileHandler } from '../../interfaces';
import { findPurposeByPrefix, parseObjectKey } from '../../utils/object-key';

const SKIP_REASONS = new Set(['unknown purpose', 'object not found']);

@Injectable()
export class UploadEventProcessor implements OnModuleInit {
	private readonly logger = new Logger(UploadEventProcessor.name);
	private userService?: UserServiceClient;

	constructor(
		@Inject(LISTEN_EVENTS) private readonly listen: IListenEvents,
		@Inject(FILE_HANDLER) private readonly handler: IFileHandler,
		@Inject(USER_PACKAGE) private readonly userClient: ClientGrpc,
	) {}

	onModuleInit(): void {
		this.userService = this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
		this.listen.onUpload(async ({ fileKey }) => this.handle(fileKey));
	}

	private async handle(fileKey: string): Promise<void> {
		const result = await this.handler.verifyUpload({ key: fileKey });

		const parsed = parseObjectKey(fileKey);
		const purpose = parsed ? findPurposeByPrefix(parsed.prefix) : undefined;
		if (purpose === 'avatar') {
			await this.notifyAvatarStatus(fileKey, result.confirmed, result.mimeType);
		}

		if (result.reason !== undefined && SKIP_REASONS.has(result.reason)) {
			this.logger.log(`Upload event received, skipping verification: key=${fileKey} reason=${result.reason}`);
			return;
		}

		this.logger.log(`Upload event received: key=${fileKey} confirmed=${String(result.confirmed)}${result.reason !== undefined ? ` reason=${result.reason}` : ''}`);
	}

	private async notifyAvatarStatus(mediaKey: string, confirmed: boolean, mimeType: string | null): Promise<void> {
		if (!this.userService) return;
		try {
			await lastValueFrom(
				this.userService.setAvatarStatus({
					mediaKey,
					status: confirmed ? AvatarStatus.AVATAR_STATUS_ACTIVE : AvatarStatus.AVATAR_STATUS_REJECTED,
					mimeType: mimeType ?? undefined,
				}),
			);
			this.logger.log(`Avatar status reported to user-service: key=${mediaKey} status=${confirmed ? 'ACTIVE' : 'REJECTED'}`);
		} catch (error) {
			this.logger.error(`Failed to report avatar status to user-service: key=${mediaKey}`, error instanceof Error ? error.stack : String(error));
		}
	}
}
