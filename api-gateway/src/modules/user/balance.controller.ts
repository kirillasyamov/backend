import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransferBalanceRequestDto, TransferBalanceResponseDto } from './dto';
import { UserService } from './user.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Balance')
@Controller('balance')
export class UserBalanceController {
	constructor(private readonly userService: UserService) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Transfer balance' })
	@ApiBody({ type: TransferBalanceRequestDto })
	@ApiOkResponse({ type: TransferBalanceResponseDto })
	@Post('transfer')
	@HttpCode(HttpStatus.OK)
	public async transferBalance(@CurrentUser('sub') accountId: string, @Body() dto: TransferBalanceRequestDto): Promise<TransferBalanceResponseDto> {
		return await this.userService.transferBalance(accountId, dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Reset all balances' })
	@Post('reset')
	@Roles('admin')
	@HttpCode(HttpStatus.OK)
	public async resetBalance(): Promise<void> {
		await this.userService.resetBalance();
	}
}
