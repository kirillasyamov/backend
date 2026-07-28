import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
import { PrismaModule } from 'common/modules/prisma';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaConfig } from 'common/configs/prisma.config';
import { ConfigModule } from 'common/modules/config';
import { prismaSchema } from 'common/configs/prisma.scheme';
import { grpcSchema } from 'common/configs/grpc.scheme';
import { grpcServiceConfig } from 'common/configs/grpc.config';
import { fileURLToPath } from 'node:url';

const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));

@Module({
	imports: [
		ConfigModule.forRoot(prismaSchema, grpcSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient as any,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
		ClientsModule.registerAsync([
			{
				name: 'TOKEN_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['token.v1', 'grpc.health.v1'],
						protoPath: [
							'../common/contracts/proto/token.proto',
							healthProtoPath,
						],
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
