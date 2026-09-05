import { Module } from '@nestjs/common';
import { LISTEN_EVENTS } from './listen-events.interface';
import { S3EventsListener } from './s3-events-listener.service';

@Module({
	providers: [
		{
			provide: LISTEN_EVENTS,
			useClass: S3EventsListener,
		},
	],
	exports: [LISTEN_EVENTS],
})
export class S3EventsListeningModule {}
