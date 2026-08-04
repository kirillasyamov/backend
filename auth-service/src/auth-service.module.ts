import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
import { tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { PrismaModule, ConfigModule } from '@kirillasyamov/common';
import { prismaConfig, prismaSchema, grpcSchema, grpcServiceConfig } from '@kirillasyamov/common/configs';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Module({
	imports: [
		ConfigModule.forRoot(prismaSchema, grpcSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
		ClientsModule.registerAsync([
			{
				name: 'TOKEN_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['token.v1', 'grpc.health.v1'],
						protoPath: [tokenProtoPath, healthProtoPath],
						url: grpcServiceConfig.tokenServiceUrl,
					},
				}),
			},
		]),
	],
	controllers: [AuthServiceController],
	providers: [AuthService, AccountRepository, SessionRepository, RoleRepository],
})
export class AuthServiceModule {}
