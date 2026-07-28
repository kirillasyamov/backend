import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
	AuthServiceController as AuthServiceControllerInterface,
	CreateAccountRequest,
	CreateAccountResponse,
	DeleteAccountRequest,
	ChangePasswordRequest,
	ChangeEmailRequest,
	CreateSessionRequest,
	CreateSessionResponse,
	RevokeSessionRequest,
	RefreshSessionRequest,
	RefreshSessionResponse,
	GetSessionsRequest,
	GetSessionsResponse,
} from 'common/contracts/generated/auth';
import { AuthServiceControllerMethods } from 'common/contracts/generated/auth';
import { AuthService } from './auth-service.service';

@Controller()
@AuthServiceControllerMethods()
export class AuthServiceController implements AuthServiceControllerInterface {
	constructor(private readonly authService: AuthService) {}

	@GrpcMethod('Health', 'Check')
	public async check(): Promise<{ status: number }> {
		return { status: 1 };
	}

	public async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
		return this.authService.createAccount(request);
	}

	public async deleteAccount(request: DeleteAccountRequest): Promise<void> {
		return this.authService.deleteAccount(request);
	}

	public async changePassword(request: ChangePasswordRequest): Promise<void> {
		return this.authService.changePassword(request);
	}

	public async changeEmail(request: ChangeEmailRequest): Promise<void> {
		return this.authService.changeEmail(request);
	}

	public async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		return this.authService.createSession(request);
	}

	public async revokeSession(request: RevokeSessionRequest): Promise<void> {
		return this.authService.revokeSession(request);
	}

	public async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
		return this.authService.refreshSession(request);
	}

	public async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
		return this.authService.getSessions(request);
	}
}
