import { ApiProperty } from '@nestjs/swagger';

export class TokenPairResponseDto {
	@ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIs...' })
	accessToken!: string;

	@ApiProperty({ example: 'Zm9vYmFyYmF6...' })
	refreshToken!: string;
}
