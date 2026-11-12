import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile.dto';

export class GetUsersResponseDto {
	@ApiProperty({ type: [UserProfileResponseDto] })
	users!: UserProfileResponseDto[];

	@ApiProperty({ example: 3 })
	total!: number;

	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 10 })
	limit!: number;
}
