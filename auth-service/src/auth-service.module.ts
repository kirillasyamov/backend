import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
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
	controllers: [AuthServiceController],
	providers: [AuthService, AccountRepository, SessionRepository, RoleRepository],
})
export class AuthServiceModule {}
