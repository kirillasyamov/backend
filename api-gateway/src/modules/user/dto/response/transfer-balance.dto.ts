import { ApiProperty } from '@nestjs/swagger';

export class TransferBalanceResponseDto {
	@ApiProperty({ example: '95.00' })
	updatedBalance!: string;
}
