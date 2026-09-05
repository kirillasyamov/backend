import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile.dto';

export class AvatarDataResponseDto {
	@ApiProperty({ example: 'av_9cX4...' })
	avatarId!: string;

	@ApiProperty({ example: 'avatar/acct/550e8400...' })
	mediaKey!: string;

	@ApiPropertyOptional({ example: 'image/png' })
	mimeType?: string;

	@ApiProperty({ example: '2026-08-31T12:00:00.000Z' })
	createdAt!: string;
}

export class MostActiveUserResponseDto {
	@ApiPropertyOptional({ type: UserProfileResponseDto })
	profile?: UserProfileResponseDto;

	@ApiPropertyOptional({ type: AvatarDataResponseDto })
	latestAvatar?: AvatarDataResponseDto;
}

export class GetMostActiveUsersResponseDto {
	@ApiProperty({ type: [MostActiveUserResponseDto] })
	users!: MostActiveUserResponseDto[];

	@ApiProperty({ example: 3 })
	total!: number;

	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 10 })
	limit!: number;
}
