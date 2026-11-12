import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
	@ApiProperty({ example: 'alice' })
	login!: string;

	@ApiProperty({ example: 'alice@example.com' })
	email!: string;

	@ApiProperty({ example: 30 })
	age!: number;

	@ApiProperty({ example: 'Hello, I am Alice.' })
	bio!: string;

	@ApiProperty({ example: '42.00' })
	balance!: string;

	@ApiProperty({ type: [String], example: ['avatar/acct/550e8400...'], description: 'Media keys of the user avatars' })
	avatars!: string[];
}
