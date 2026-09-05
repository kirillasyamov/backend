import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UploadAvatarRequestDto {
	@ApiPropertyOptional({ example: 'me.png' })
	@IsOptional()
	@IsString()
	fileName?: string;

	@ApiPropertyOptional({ example: 2048 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	sizeBytes?: number;
}
