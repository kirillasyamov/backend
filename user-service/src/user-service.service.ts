import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Prisma, User } from '../prisma/generated/client';
import { UserRepository } from './user.repository';
import {
	CreateUserRequest,
	CreateUserResponse,
	GetUserRequest,
	GetUserResponse,
	GetUsersRequest,
	GetUsersResponse,
	UpdateUserRequest,
	UpdateUserResponse,
	DeleteUserRequest,
	TransferBalanceRequest,
	TransferBalanceResponse,
	UserProfileData,
} from '@kirillasyamov/common/contracts/generated/user';
import type { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepository: UserRepository,
		@InjectQueue('balance-reset') private readonly balanceResetQueue: Queue,
	) {}

	private adaptToProfile(user: User): UserProfileData {
		return { login: user.login, email: user.email, age: user.age, bio: user.bio, balance: user.balance.toFixed(2) };
	}

	public async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		try {
			const user = await this.userRepository.reactivateOrCreate({
				login: request.login,
				email: request.email,
				age: request.age,
				bio: request.bio,
			});
			return { userProfile: this.adaptToProfile(user), profileId: user.id };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
				const target = (error.meta?.target as string[] | undefined) ?? [];
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

		return { userProfile: { login: user.login, email: user.email, age: user.age, bio: user.bio, balance: user.balance.toFixed(2) } };
	}

	public async getUsers(request: GetUsersRequest): Promise<GetUsersResponse> {
		const page = request.page || 1;
		const limit = request.limit || 10;
		const { users, total } = await this.userRepository.findAll(page, limit);
		return {
			users: users.map(u => this.adaptToProfile(u)),
			total,
			page,
			limit,
		};
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

		return { userProfile: this.adaptToProfile(user) };
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

	public async transferBalance(request: TransferBalanceRequest): Promise<TransferBalanceResponse> {
		const amount = this.parseAmount(request.amount);
		const sender = await this.userRepository.findByLogin(request.senderLogin);
		if (!sender) throw new RpcException({ code: status.NOT_FOUND, message: 'Sender not found' });
		const recipient = await this.userRepository.findByLogin(request.recipientLogin);
		if (!recipient) throw new RpcException({ code: status.NOT_FOUND, message: 'Recipient not found' });
		if (amount.greaterThan(sender.balance)) throw new RpcException({ code: status.FAILED_PRECONDITION, message: 'Insufficient funds' });

		try {
			await this.userRepository.transferBalance(sender.id, recipient.id, amount, request.idempotencyKey);
		} catch (error) {
			if (error instanceof Error) throw new RpcException({ code: status.FAILED_PRECONDITION, message: error.message });
			throw error;
		}
		const updated = await this.userRepository.findByLogin(request.senderLogin);
		if (!updated) throw new RpcException({ code: status.NOT_FOUND, message: 'Sender not found' });
		return { updatedBalance: updated.balance.toFixed(2) };
	}

	private parseAmount(value: string): Prisma.Decimal {
		const decimal = new Prisma.Decimal(value);
		if (!decimal.isFinite()) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Invalid amount' });
		return decimal;
	}

	public async resetBalance(): Promise<void> {
		await this.balanceResetQueue.add('reset', {}, { jobId: 'balance-reset' });
	}
}
