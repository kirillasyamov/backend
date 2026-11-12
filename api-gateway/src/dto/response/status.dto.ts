import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
	@ApiProperty({ example: 'OK' })
	status!: string;
}
