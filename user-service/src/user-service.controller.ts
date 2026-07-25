import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user-service.service';
import type { CreateUserRequest, GetUserRequest, GetUsersRequest, UpdateUserRequest, DeleteUserRequest } from 'common/contracts/generated/user';

@Controller()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@GrpcMethod('UserService', 'CreateUser')
	public async createUser(data: CreateUserRequest) {
		return this.userService.createUser(data);
	}

	@GrpcMethod('UserService', 'DeleteUser')
	public async deleteUser(data: DeleteUserRequest) {
		return this.userService.deleteUser(data);
	}
}
