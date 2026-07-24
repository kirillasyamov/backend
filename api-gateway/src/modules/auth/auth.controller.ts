import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SignUpDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	@ApiOperation({ summary: 'Registration' })
	@ApiBody({ type: SignUpDto })
	@Post('signup')
	@HttpCode(HttpStatus.OK)
	public async signUp(@Body() dto: SignUpDto) {
		return await this.authService.signUp(dto);
	}
}
