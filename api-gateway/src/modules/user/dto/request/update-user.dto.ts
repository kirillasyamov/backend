import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserRequestDto {
	@ApiPropertyOptional({ example: 90 })
	@IsOptional()
	@IsNumber()
	@Min(0)
	age?: number;

	@ApiPropertyOptional({ example: 'aaaaaaa' })
	@IsOptional()
	@IsString()
	bio?: string;
}
