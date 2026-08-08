import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransferBalanceDto } from './dto/transfer-balance.dto';
import { UserService } from './user.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Balance')
@Controller('balance')
export class UserBalanceController {
	constructor(private readonly userService: UserService) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Transfer balance' })
	@ApiBody({ type: TransferBalanceDto })
	@Post('transfer')
	@HttpCode(HttpStatus.OK)
	public async transferBalance(@CurrentUser('sub') accountId: string, @Body() dto: TransferBalanceDto) {
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
