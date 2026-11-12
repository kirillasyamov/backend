import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateUserRequestDto {
	@ApiProperty({ example: 25 })
	@IsNumber()
	@IsNotEmpty()
	@Min(0)
	age!: number;

	@ApiProperty({ example: 'Hello, I am John.' })
	@IsString()
	@IsNotEmpty()
	bio!: string;
}
