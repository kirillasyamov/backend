import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SignUpDto } from './dto/signup.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiOperation({ summary: 'Registration' })
	@ApiBody({ type: SignUpDto })
	@Public()
	@Post('signup')
	@HttpCode(HttpStatus.OK)
	public async signUp(@Body() dto: SignUpDto) {
		return await this.authService.signUp(dto);
	}

	@ApiOperation({ summary: 'Refresh session' })
	@ApiBody({ type: RefreshDto })
	@Public()
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	public async refresh(@Body() dto: RefreshDto) {
		return await this.authService.refreshSession(dto);
	}
}
