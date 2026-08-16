import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SignUpRequestDto, SignInRequestDto, RefreshRequestDto, TokenPairResponseDto } from './dto';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from './decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiOperation({ summary: 'Create account, session, profile' })
	@ApiBody({ type: SignUpRequestDto })
	@ApiOkResponse({ type: TokenPairResponseDto })
	@Public()
	@Post('signup')
	@HttpCode(HttpStatus.OK)
	public async signUp(@Body() dto: SignUpRequestDto): Promise<TokenPairResponseDto> {
		return await this.authService.signUp(dto);
	}

	@ApiOperation({ summary: 'Create new session' })
	@ApiBody({ type: SignInRequestDto })
	@ApiOkResponse({ type: TokenPairResponseDto })
	@Public()
	@Post('signin')
	@HttpCode(HttpStatus.OK)
	public async signIn(@Body() dto: SignInRequestDto): Promise<TokenPairResponseDto> {
		return await this.authService.signIn(dto);
	}

	@ApiOperation({ summary: 'Refresh session' })
	@ApiBody({ type: RefreshRequestDto })
	@ApiOkResponse({ type: TokenPairResponseDto })
	@Public()
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	public async refresh(@Body() dto: RefreshRequestDto): Promise<TokenPairResponseDto> {
		return await this.authService.refreshSession(dto);
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Revoke current session' })
	@Post('signout')
	@HttpCode(HttpStatus.OK)
	public async signOut(@CurrentUser('sid') sid: string) {
		await this.authService.signOut(sid);
	}
}
