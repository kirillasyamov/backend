import { Module } from '@nestjs/common';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';
import { UserRepository } from './user.repository';
import { PrismaModule } from 'common/modules/prisma';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigModule } from 'common/modules/config';
import { prismaSchema } from 'common/configs/prisma.scheme';
import { grpcSchema } from 'common/configs/grpc.scheme';
import { prismaConfig } from 'common/configs/prisma.config';

@Module({
	imports: [
		ConfigModule.forRoot(prismaSchema, grpcSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
	],
	controllers: [UserController],
	providers: [UserService, UserRepository],
})
export class UserServiceModule {}
