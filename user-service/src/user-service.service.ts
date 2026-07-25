import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserRequest, CreateUserResponse, DeleteUserRequest } from 'common/contracts/generated/user';

@Injectable()
export class UserService {
	constructor(private readonly userRepository: UserRepository) {}

	public async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		const profile = request.userProfile!;
		const user = await this.userRepository.create(profile);
		return { userProfile: { login: user.login, email: user.email, age: user.age, bio: user.bio }, profileId: user.id };
	}

	public async deleteUser(request: DeleteUserRequest): Promise<void> {
		await this.userRepository.softDelete(request.id);
	}
}
