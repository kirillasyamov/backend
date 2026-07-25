import { Module } from '@nestjs/common';
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

@Module({
	imports: [
		ConfigModule.forRoot(prismaSchema, grpcSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient as any,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
	],
	controllers: [AuthServiceController],
	providers: [AuthService, AccountRepository, SessionRepository, RoleRepository],
})
export class AuthServiceModule {}
