import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	AuthServiceControllerMethods,
	type AuthServiceController as AuthServiceControllerInterface,
	type CreateAccountRequest,
	type CreateAccountResponse,
	type DeleteAccountRequest,
	type ChangePasswordRequest,
	type ChangeEmailRequest,
	type CreateSessionRequest,
	type CreateSessionResponse,
	type RevokeSessionRequest,
	type RefreshSessionRequest,
	type RefreshSessionResponse,
	type GetSessionsRequest,
	type GetSessionsResponse,
	type GetAccountByLoginRequest,
	type GetAccountByLoginResponse,
	type GetAccountByEmailRequest,
	type GetAccountByEmailResponse,
	type GetAccountByIdRequest,
	type GetAccountByIdResponse,
} from '@kirillasyamov/common/contracts/generated/auth';
import { AuthService } from './auth-service.service';
import { HEALTH_STATUS_SERVING } from './auth-service.constants';

@Controller()
@AuthServiceControllerMethods()
export class AuthServiceController implements AuthServiceControllerInterface {
	constructor(private readonly authService: AuthService) {}

	@GrpcMethod('Health', 'Check')
	public check(): { status: number } {
		return { status: HEALTH_STATUS_SERVING };
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

	public async getAccountByLogin(request: GetAccountByLoginRequest): Promise<GetAccountByLoginResponse> {
		return this.authService.getAccountByLogin(request);
	}

	public async getAccountByEmail(request: GetAccountByEmailRequest): Promise<GetAccountByEmailResponse> {
		return this.authService.getAccountByEmail(request);
	}

	public async getAccountById(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
		return this.authService.getAccountById(request);
	}

	public async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
		return this.authService.getSessions(request);
	}
}
