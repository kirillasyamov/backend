import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { AccountRepository, SessionRepository, RoleRepository } from './repositories';
import { TOKEN_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { PrismaModule, ConfigModule } from '@kirillasyamov/common';
import { TOKEN_PACKAGE } from './auth-service.constants';
import { prismaConfig, prismaSchema, grpcSchema, grpcServiceConfig, grpcClients } from '@kirillasyamov/common/configs';
import { PrismaClient } from '@prismagen/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Module({
	imports: [
		ConfigModule.forRoot(prismaSchema, grpcSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
		ClientsModule.registerAsync(
			grpcClients([
				{
					name: TOKEN_PACKAGE,
					packages: [TOKEN_PROTO_VERSION, HEALTH_PROTO_VERSION],
					protoPaths: [tokenProtoPath, healthProtoPath],
					url: grpcServiceConfig.tokenServiceUrl,
				},
			]),
		),
	],
	controllers: [AuthServiceController],
	providers: [AuthService, AccountRepository, SessionRepository, RoleRepository],
})
export class AuthServiceModule {}
