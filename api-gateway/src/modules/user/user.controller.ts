import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create user profile' })
	@ApiBody({ type: CreateUserDto })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	public async createUser(@CurrentUser('sub') accountId: string, @Body() dto: CreateUserDto) {
		return await this.userService.createUser(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBody({ type: UpdateUserDto })
	@Patch()
	@HttpCode(HttpStatus.OK)
	public async updateUser(@CurrentUser('sub') accountId: string, @Body() dto: UpdateUserDto) {
		return await this.userService.updateUser(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete user profile' })
	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	public async deleteUser(@CurrentUser('sub') accountId: string): Promise<void> {
		await this.userService.deleteUser(accountId);
	}
}
