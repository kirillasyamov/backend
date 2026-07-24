import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'AUTH_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: 'auth.v1',
						protoPath: '../common/contracts/proto/auth.proto',
						url: 'localhost:50002',
					},
				}),
			},
			{
				name: 'USER_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: 'user.v1',
						protoPath: '../common/contracts/proto/user.proto',
						url: 'localhost:50051',
					},
				}),
			},
		]),
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [ClientsModule],
})
export class AuthModule {}
