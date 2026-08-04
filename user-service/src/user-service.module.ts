import { Module } from '@nestjs/common';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';
import { UserRepository } from './user.repository';
import { PrismaModule, ConfigModule } from '@kirillasyamov/common';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaConfig, prismaSchema, grpcSchema } from '@kirillasyamov/common/configs';

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
