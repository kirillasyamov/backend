import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TransferBalanceRequestDto {
	@ApiProperty({ example: 'alice' })
	@IsString()
	@IsNotEmpty()
	recipientLogin!: string;

	@ApiProperty({ example: '20.51' })
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d+\.\d{2}$/, { message: 'Amount must have exactly two decimal places' })
	amount!: string;

	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	@IsString()
	@IsNotEmpty()
	idempotencyKey!: string;
}
