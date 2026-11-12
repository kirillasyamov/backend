import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarResponseDto {
	@ApiProperty({ example: 'av_9cX4...' })
	avatarId!: string;

	@ApiProperty({ example: 'avatar/acct/550e8400...' })
	mediaKey!: string;

	@ApiProperty({ example: 'https://minio.example.com/bucket/avatar/acct/550e8400...' })
	uploadUrl!: string;

	@ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
	uploadFields!: Record<string, string>;

	@ApiProperty({ example: '2026-08-31T12:00:00.000Z' })
	expiresAt!: string;
}
