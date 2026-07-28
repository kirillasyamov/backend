import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SignUpDto } from './dto/signup.dto';
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
}
