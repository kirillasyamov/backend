import { Module } from '@nestjs/common';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';
import { UserRepository } from './repositories';
import { BALANCE_RESET_QUEUE, BALANCE_RESET_JOB } from './user-service.constants';
import { PrismaModule, ConfigModule } from '@kirillasyamov/common';
import { PrismaClient } from '@prismagen/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaConfig, prismaSchema, grpcSchema, redisSchema, redisConfig, queueSchema } from '@kirillasyamov/common/configs';
import type { Job } from 'bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule, WorkerHost, Processor } from '@nestjs/bullmq';

@Processor(BALANCE_RESET_QUEUE)
class BalanceProcessor extends WorkerHost {
	constructor(private readonly userRepository: UserRepository) {
		super();
	}

	public async process(job: Job): Promise<void> {
		if (job.name === BALANCE_RESET_JOB) await this.userRepository.resetBalances();
	}
}

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot(prismaSchema, grpcSchema, redisSchema, queueSchema),
		PrismaModule.forRootAsync({
			isGlobal: true,
			clientClass: PrismaClient,
			adapter: new PrismaPg({ connectionString: prismaConfig.connectionString }),
		}),
		BullModule.forRootAsync({
			useFactory: () => ({
				connection: {
					host: redisConfig.host,
					port: redisConfig.port,
					password: redisConfig.password,
				},
			}),
		}),
		BullModule.registerQueue({ name: BALANCE_RESET_QUEUE }),
	],
	controllers: [UserController],
	providers: [UserService, UserRepository, BalanceProcessor],
})
export class UserServiceModule {}
