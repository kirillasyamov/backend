import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { UserRepository } from './user.repository';
import { CreateUserRequest, CreateUserResponse, GetUserRequest, GetUserResponse, UpdateUserRequest, UpdateUserResponse, DeleteUserRequest } from 'common/contracts/generated/user';

@Injectable()
export class UserService {
	constructor(private readonly userRepository: UserRepository) {}

	public async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		try {
			const profile = request.userProfile!;
			const user = await this.userRepository.reactivateOrCreate(profile);
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

	public async getUser(request: GetUserRequest): Promise<GetUserResponse> {
		const login = request.login;
		if (!login) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Login is required' });

		const user = await this.userRepository.findByLogin(login);
		if (!user) throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });

		return { userProfile: { login: user.login, email: user.email, age: user.age, bio: user.bio } };
	}

	public async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
		const existing = await this.userRepository.findByLogin(request.login);
		if (!existing) {
			throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
		}

		const user = await this.userRepository.update(request.login, {
			age: request.age,
			bio: request.bio,
		});

		return { userProfile: { login: user.login, email: user.email, age: user.age, bio: user.bio } };
	}

	public async deleteUser(request: DeleteUserRequest): Promise<void> {
		try {
			let id = request.id;
			if (!id && request.login) {
				const user = await this.userRepository.findByLogin(request.login);
				if (!user) {
					throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
				}
				id = user.id;
			}
			if (!id) {
				throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Either id or login must be provided' });
			}
			await this.userRepository.softDelete(id);
		} catch (error) {
			if (error instanceof RpcException) throw error;
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
