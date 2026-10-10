import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, Roles } from '../auth/decorators';
import { CacheEvict } from '../cache/decorators';
import { CacheService } from '../cache/cache.service';
import { TransferBalanceRequestDto, TransferBalanceResponseDto } from './dto';
import { UserService } from './user.service';

@ApiTags('Balance')
@Controller('balance')
export class UserBalanceController {
	constructor(
		private readonly userService: UserService,
		private readonly cache: CacheService,
	) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Transfer balance' })
	@ApiBody({ type: TransferBalanceRequestDto })
	@ApiOkResponse({ type: TransferBalanceResponseDto })
	@CacheEvict({ prefix: 'users:' })
	@Post('transfer')
	@HttpCode(HttpStatus.OK)
	public async transferBalance(@CurrentUser('sub') accountId: string, @Body() dto: TransferBalanceRequestDto): Promise<TransferBalanceResponseDto> {
		return await this.userService.transferBalance(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Reset all balances' })
	@CacheEvict({ prefix: 'users:' })
	@Post('reset')
	@Roles('admin')
	@HttpCode(HttpStatus.OK)
	public async resetBalance(): Promise<void> {
		await this.userService.resetBalance();
	}
}
