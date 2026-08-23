import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user-service.service';
import {
	UserServiceControllerMethods,
	type CreateUserRequest,
	type CreateUserResponse,
	type GetUserRequest,
	type GetUserResponse,
	type GetUsersRequest,
	type GetUsersResponse,
	type UpdateUserRequest,
	type UpdateUserResponse,
	type DeleteUserRequest,
	type TransferBalanceRequest,
	type TransferBalanceResponse,
} from '@kirillasyamov/common/contracts/generated/user';
import { HEALTH_STATUS_SERVING } from './user-service.constants';

@Controller()
@UserServiceControllerMethods()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@GrpcMethod('Health', 'Check')
	public check(): { status: number } {
		return { status: HEALTH_STATUS_SERVING };
	}

	public async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
		return this.userService.createUser(data);
	}

	public async getUser(data: GetUserRequest): Promise<GetUserResponse> {
		return this.userService.getUser(data);
	}

	public async getUsers(data: GetUsersRequest): Promise<GetUsersResponse> {
		return this.userService.getUsers(data);
	}

	public async updateUser(data: UpdateUserRequest): Promise<UpdateUserResponse> {
		return this.userService.updateUser(data);
	}

	public async deleteUser(data: DeleteUserRequest): Promise<void> {
		return this.userService.deleteUser(data);
	}

	public async transferBalance(data: TransferBalanceRequest): Promise<TransferBalanceResponse> {
		return this.userService.transferBalance(data);
	}

	public async resetBalance(): Promise<void> {
		return this.userService.resetBalance();
	}
}
