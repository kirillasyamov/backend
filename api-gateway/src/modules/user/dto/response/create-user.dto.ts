import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile.dto';

export class CreateUserResponseDto {
	@ApiProperty({ type: UserProfileResponseDto })
	userProfile!: UserProfileResponseDto;

	@ApiProperty({ example: 'usr_9cX4...' })
	profileId!: string;
}
