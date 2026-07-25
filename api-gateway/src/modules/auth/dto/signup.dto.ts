import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsNumber, Min } from 'class-validator';

export class SignUpDto {
    @ApiProperty({ example: 'user222', type: String })
    @IsString()
    @IsNotEmpty()
    login!: string;

    @ApiProperty({ example: 'user@example.com', type: String })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ example: 'password123', type: String })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password!: string;

	@ApiProperty({ example: 'Chrome 120 / Windows 11', type: String })
	@IsString()
	@IsNotEmpty()
	device!: string;

	@ApiProperty({ example: 18, type: Number })
	@IsNumber()
	@IsNotEmpty()
	@Min(0)
	age!: number

	@ApiProperty({ example: 'node.js backend developer', type: String })
	@IsString()
	@IsNotEmpty()
	bio!: string
}