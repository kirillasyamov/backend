import { Module } from '@nestjs/common';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';
import { UserRepository } from './user.repository';
import { PrismaModule } from 'common/modules/prisma';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Module({
	imports: [
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient as any,
			adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
		}),
	],
	controllers: [UserController],
	providers: [UserService, UserRepository],
})
export class UserServiceModule {}
