import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UserService } from './user-service.service';
import type {
	CreateUserRequest,
	CreateUserResponse,
	GetUserRequest,
	GetUserResponse,
	GetUsersRequest,
	GetUsersResponse,
	UpdateUserRequest,
	UpdateUserResponse,
	DeleteUserRequest,
} from 'common/contracts/generated/user';
import { UserServiceControllerMethods } from 'common/contracts/generated/user';

@Controller()
@UserServiceControllerMethods()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@GrpcMethod('Health', 'Check')
	public async check(): Promise<{ status: number }> {
		return { status: 1 };
	}

	public async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
		return this.userService.createUser(data);
	}

	public async getUser(_data: GetUserRequest): Promise<GetUserResponse> {
		throw new RpcException({ code: status.UNIMPLEMENTED, message: 'Method GetUser not implemented' });
	}

	public async getUsers(_data: GetUsersRequest): Promise<GetUsersResponse> {
		throw new RpcException({ code: status.UNIMPLEMENTED, message: 'Method GetUsers not implemented' });
	}

	public async updateUser(data: UpdateUserRequest): Promise<UpdateUserResponse> {
		return this.userService.updateUser(data);
	}

	public async deleteUser(data: DeleteUserRequest): Promise<void> {
		return this.userService.deleteUser(data);
	}
}
