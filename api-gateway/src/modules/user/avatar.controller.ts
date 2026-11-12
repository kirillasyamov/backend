import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators';
import { CacheEvict, CacheGet } from '../cache/decorators';
import { CacheService } from '../cache/cache.service';
import { GetMostActiveUsersResponseDto, UploadAvatarRequestDto, UploadAvatarResponseDto } from './dto';
import { UserService } from './user.service';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@/gateway.constants';

@ApiTags('Avatar')
@Controller('user')
export class AvatarController {
	constructor(
		private readonly userService: UserService,
		private readonly cache: CacheService,
	) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Upload avatar' })
	@ApiBody({ type: UploadAvatarRequestDto })
	@ApiOkResponse({ type: UploadAvatarResponseDto })
	@CacheEvict({ prefix: 'users:' })
	@Post('avatar')
	@HttpCode(HttpStatus.CREATED)
	public async uploadAvatar(@CurrentUser('sub') accountId: string, @Body() dto: UploadAvatarRequestDto): Promise<UploadAvatarResponseDto> {
		return await this.userService.uploadAvatar(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete avatar' })
	@ApiParam({ name: 'avatarId', type: String })
	@CacheEvict({ prefix: 'users:' })
	@Delete('avatar/:avatarId')
	@HttpCode(HttpStatus.NO_CONTENT)
	public async deleteAvatar(@CurrentUser('sub') accountId: string, @Param('avatarId') avatarId: string): Promise<void> {
		await this.userService.deleteAvatar(accountId, avatarId);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get most active users' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
	@ApiQuery({ name: 'minAge', required: false, type: Number })
	@ApiQuery({ name: 'maxAge', required: false, type: Number })
	@ApiOkResponse({ type: GetMostActiveUsersResponseDto })
	@CacheGet({
		keyResolver: (page: number, limit: number, minAge?: number, maxAge?: number) =>
			`users:most-active:${String(page)}:${String(limit)}:${String(minAge ?? '*')}:${String(maxAge ?? '*')}`,
	})
	@Get('most-active')
	@HttpCode(HttpStatus.OK)
	public async getMostActiveUsers(
		@Query('page') page = DEFAULT_PAGE,
		@Query('limit') limit = DEFAULT_LIMIT,
		@Query('minAge') minAge?: number,
		@Query('maxAge') maxAge?: number,
	): Promise<GetMostActiveUsersResponseDto> {
		return await this.userService.getMostActiveUsers(page, limit, minAge, maxAge);
	}
}
