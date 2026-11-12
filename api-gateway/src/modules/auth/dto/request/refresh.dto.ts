import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
	@ApiProperty({ example: 'some-refresh-token' })
	@IsString()
	@IsNotEmpty()
	refreshToken!: string;
}
