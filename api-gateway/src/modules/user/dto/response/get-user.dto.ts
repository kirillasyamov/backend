import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile.dto';

export class GetUserResponseDto {
	@ApiProperty({ type: UserProfileResponseDto })
	userProfile!: UserProfileResponseDto;
}
