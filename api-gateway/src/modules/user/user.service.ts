import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import type { AuthServiceClient } from '@kirillasyamov/common/contracts/generated/auth';
import type {
	UserServiceClient,
	CreateUserResponse,
	GetUserResponse,
	GetUsersResponse,
	UpdateUserResponse,
	TransferBalanceResponse,
	UploadAvatarResponse,
	GetMostActiveUsersResponse,
} from '@kirillasyamov/common/contracts/generated/user';
import type { MediaServiceClient, RequestUploadUrlResponse } from '@kirillasyamov/common/contracts/generated/media';
import { AUTH_PACKAGE, USER_PACKAGE, MEDIA_PACKAGE } from '@/gateway.constants';
import { CreateUserRequestDto, UpdateUserRequestDto, TransferBalanceRequestDto, UploadAvatarRequestDto } from './dto';

@Injectable()
export class UserService implements OnModuleInit {
	private readonly logger = new Logger(UserService.name);
	private authGrpcService!: AuthServiceClient;
	private userGrpcService!: UserServiceClient;
	private mediaGrpcService!: MediaServiceClient;

	constructor(
		@Inject(AUTH_PACKAGE) private readonly authClient: ClientGrpc,
		@Inject(USER_PACKAGE) private readonly userClient: ClientGrpc,
		@Inject(MEDIA_PACKAGE) private readonly mediaClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.authGrpcService = this.authClient.getService<AuthServiceClient>('AuthService');
		this.userGrpcService = this.userClient.getService<UserServiceClient>('UserService');
		this.mediaGrpcService = this.mediaClient.getService<MediaServiceClient>('MediaService');
	}

	private async callGrpc<T>(service: string, method: string, operation: () => Promise<T>): Promise<T> {
		const started = Date.now();
		try {
			const result = await operation();
			this.logger.debug(`${service}.${method} ok ${String(Date.now() - started)}ms`);
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.debug(`${service}.${method} failed ${String(Date.now() - started)}ms: ${message}`);
			throw error;
		}
	}

	public async createUser(accountId: string, data: CreateUserRequestDto): Promise<CreateUserResponse> {
		const { login, email } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { age, bio } = data;
		return this.callGrpc('UserService', 'createUser', async () => firstValueFrom(this.userGrpcService.createUser({ login, email, age, bio })));
	}

	public async updateUser(accountId: string, data: UpdateUserRequestDto): Promise<UpdateUserResponse> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { age, bio } = data;
		return this.callGrpc('UserService', 'updateUser', async () => firstValueFrom(this.userGrpcService.updateUser({ login, age, bio })));
	}

	public async getUsers(page: number, limit: number): Promise<GetUsersResponse> {
		return this.callGrpc('UserService', 'getUsers', async () => firstValueFrom(this.userGrpcService.getUsers({ page, limit })));
	}

	public async getUser(login: string): Promise<GetUserResponse> {
		return this.callGrpc('UserService', 'getUser', async () => firstValueFrom(this.userGrpcService.getUser({ login })));
	}

	public async getMe(accountId: string): Promise<GetUserResponse> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		return this.callGrpc('UserService', 'getUser', async () => firstValueFrom(this.userGrpcService.getUser({ login })));
	}

	public async deleteUser(accountId: string): Promise<void> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		await this.callGrpc('UserService', 'deleteUser', async () => firstValueFrom(this.userGrpcService.deleteUser({ login })));
	}

	public async transferBalance(accountId: string, request: TransferBalanceRequestDto): Promise<TransferBalanceResponse> {
		const { login: senderLogin } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { recipientLogin, amount, idempotencyKey } = request;
		return this.callGrpc('UserService', 'transferBalance', async () =>
			firstValueFrom(this.userGrpcService.transferBalance({ senderLogin, recipientLogin, amount, idempotencyKey })),
		);
	}

	public async resetBalance(): Promise<void> {
		await this.callGrpc('UserService', 'resetBalance', async () => firstValueFrom(this.userGrpcService.resetBalance({})));
	}

	public async uploadAvatar(
		accountId: string,
		request: UploadAvatarRequestDto,
	): Promise<{
		avatarId: string;
		mediaKey: string;
		uploadUrl: string;
		uploadFields: Record<string, string>;
		expiresAt: string;
	}> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));

		const mediaUrl = await this.callGrpc('MediaService', 'requestUploadUrl', async () =>
			firstValueFrom(
				this.mediaGrpcService.requestUploadUrl({ purpose: 'avatar', ownerAccountId: accountId, filename: request.fileName, sizeBytes: request.sizeBytes, metadata: {} }),
			),
		);

		const avatar = await this.callGrpc('UserService', 'uploadAvatar', async () =>
			firstValueFrom(this.userGrpcService.uploadAvatar({ login, mediaKey: mediaUrl.key, fileName: request.fileName, sizeBytes: request.sizeBytes })),
		);

		return this.composeUploadAvatar(mediaUrl, avatar);
	}

	public async deleteAvatar(accountId: string, avatarId: string): Promise<void> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		await this.callGrpc('UserService', 'deleteAvatar', async () => firstValueFrom(this.userGrpcService.deleteAvatar({ login, avatarId })));
	}

	public async getMostActiveUsers(page: number, limit: number, minAge?: number, maxAge?: number): Promise<GetMostActiveUsersResponse> {
		return this.callGrpc('UserService', 'getMostActiveUsers', async () =>
			firstValueFrom(
				this.userGrpcService.getMostActiveUsers({
					page,
					limit,
					...(minAge !== undefined ? { minAge } : {}),
					...(maxAge !== undefined ? { maxAge } : {}),
				}),
			),
		);
	}

	private composeUploadAvatar(
		media: RequestUploadUrlResponse,
		avatar: UploadAvatarResponse,
	): {
		avatarId: string;
		mediaKey: string;
		uploadUrl: string;
		uploadFields: Record<string, string>;
		expiresAt: string;
	} {
		return {
			avatarId: avatar.avatarId,
			mediaKey: media.key,
			uploadUrl: media.url,
			uploadFields: media.fields,
			expiresAt: media.expiresAt,
		};
	}
}
