import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';

export class SignInDto {
	@ApiProperty({ example: 'user222', required: false })
	@ValidateIf((o: SignInDto) => !o.email || Boolean(o.login))
	@IsString()
	@IsNotEmpty({ message: 'Укажите login или email' })
	login?: string;

	@ApiProperty({ example: 'user@example.com', required: false })
	@ValidateIf((o: SignInDto) => !o.login || Boolean(o.email))
	@IsEmail({}, { message: 'Некорректный формат email' })
	email?: string;

	@ApiProperty({ example: 'password123' })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password!: string;

	@ApiProperty({ example: 'Chrome 120 / Windows 11' })
	@IsString()
	@IsNotEmpty()
	device!: string;
}
