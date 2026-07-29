import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBody({ type: UpdateUserDto })
	@Patch()
	@HttpCode(HttpStatus.OK)
	public async updateUser(@CurrentUser('sub') accountId: string, @Body() dto: UpdateUserDto) {
		return await this.userService.updateUser(accountId, dto);
	}
}
