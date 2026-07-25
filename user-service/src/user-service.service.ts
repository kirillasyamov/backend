import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { UserRepository } from './user.repository';
import { CreateUserRequest, CreateUserResponse, DeleteUserRequest } from 'common/contracts/generated/user';

@Injectable()
export class UserService {
	constructor(private readonly userRepository: UserRepository) {}

	public async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		try {
			const profile = request.userProfile!;
			const user = await this.userRepository.create(profile);
			return { userProfile: { login: user.login, email: user.email, age: user.age, bio: user.bio }, profileId: user.id };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
				const target = (error.meta?.target as string[]) ?? [];
				const field = target.includes('email') ? 'email' : target.includes('login') ? 'login' : 'value';
				throw new RpcException({
					code: status.ALREADY_EXISTS,
					message: `A user with this ${field} already exists`,
				});
			}
			throw error;
		}
	}

	public async deleteUser(request: DeleteUserRequest): Promise<void> {
		try {
			await this.userRepository.softDelete(request.id);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new RpcException({
					code: status.NOT_FOUND,
					message: 'User not found',
				});
			}
			throw error;
		}
	}
}
