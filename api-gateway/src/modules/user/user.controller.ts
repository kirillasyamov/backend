import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators';
import { CacheEvict, CacheGet } from '../cache/decorators';
import { CacheService } from '../cache/cache.service';
import { CreateUserRequestDto, UpdateUserRequestDto, CreateUserResponseDto, GetUserResponseDto, GetUsersResponseDto } from './dto';
import { UserService } from './user.service';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@/gateway.constants';

@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly cache: CacheService,
	) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create user profile' })
	@ApiBody({ type: CreateUserRequestDto })
	@ApiOkResponse({ type: CreateUserResponseDto })
	@CacheEvict({ prefix: 'users:' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	public async createUser(@CurrentUser('sub') accountId: string, @Body() dto: CreateUserRequestDto) {
		return await this.userService.createUser(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBody({ type: UpdateUserRequestDto })
	@ApiOkResponse({ type: GetUserResponseDto })
	@CacheEvict({ prefix: 'users:' })
	@Patch()
	@HttpCode(HttpStatus.OK)
	public async updateUser(@CurrentUser('sub') accountId: string, @Body() dto: UpdateUserRequestDto) {
		return await this.userService.updateUser(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete user profile' })
	@CacheEvict({ prefix: 'users:' })
	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	public async deleteUser(@CurrentUser('sub') accountId: string): Promise<void> {
		await this.userService.deleteUser(accountId);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Read current user profile' })
	@ApiOkResponse({ type: GetUserResponseDto })
	@Get('me')
	@HttpCode(HttpStatus.OK)
	public async getMe(@CurrentUser('sub') accountId: string) {
		return await this.userService.getMe(accountId);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Read all user profiles' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
	@ApiOkResponse({ type: GetUsersResponseDto })
	@CacheGet({ keyResolver: (page: number, limit: number) => `users:list:${String(page)}:${String(limit)}` })
	@Get('all')
	@HttpCode(HttpStatus.OK)
	public async getUsers(@Query('page') page = DEFAULT_PAGE, @Query('limit') limit = DEFAULT_LIMIT): Promise<GetUsersResponseDto> {
		return await this.userService.getUsers(page, limit);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Read user profile by login' })
	@ApiOkResponse({ type: GetUserResponseDto })
	@CacheGet({ keyResolver: (login: string) => `users:by-login:${login}` })
	@Get(':login')
	@HttpCode(HttpStatus.OK)
	public async getUser(@Param('login') login: string) {
		return await this.userService.getUser(login);
	}
}
