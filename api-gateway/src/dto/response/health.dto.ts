import { ApiProperty } from '@nestjs/swagger';

class ServiceHealthDto {
	@ApiProperty({ example: true })
	health!: boolean;
}

export class HealthResponseDto {
	@ApiProperty({ type: ServiceHealthDto })
	'api-gateway'!: ServiceHealthDto;

	@ApiProperty({ type: ServiceHealthDto })
	'auth-service'!: ServiceHealthDto;

	@ApiProperty({ type: ServiceHealthDto })
	'user-service'!: ServiceHealthDto;

	@ApiProperty({ type: ServiceHealthDto })
	'token-service'!: ServiceHealthDto;
}
