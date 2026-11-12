import { ApiProperty } from '@nestjs/swagger';

export class AppInfoResponseDto {
	@ApiProperty({ example: 'OK' })
	status!: string;

	@ApiProperty({ example: 1755282600000 })
	timestamp!: number;
}
