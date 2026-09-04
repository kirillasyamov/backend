import { Logger } from '@nestjs/common';
import { NoSuchKey, NotFound } from '@aws-sdk/client-s3';
import type { ErrorMapperContext } from '../../../decorators';

export class S3ObjectNotFoundError extends Error {
	constructor(
		message: string,
		readonly bucket: string,
		readonly key: string,
		readonly cause?: unknown,
	) {
		super(message, { cause });
		this.name = 'S3ObjectNotFoundError';
	}
}

const logger = new Logger('S3ClientService');

type S3Args = [bucket: string, ...rest: unknown[]];

export const s3ErrorMapper = <Args extends S3Args>(error: unknown, { operation, context, args }: ErrorMapperContext<Args>): Error => {
	if (isNotFoundError(error)) return toNotFoundError(args, error);

	logger.error(`${operation} failed for "${context}"`, error as Error);

	return isError(error) ? error : toError(error, context);
};

function isNotFoundError(error: unknown): boolean {
	return error instanceof NotFound || error instanceof NoSuchKey;
}

function toNotFoundError([bucket, key]: S3Args, error: unknown): S3ObjectNotFoundError {
	return new S3ObjectNotFoundError(`Object "${bucket}/${String(key)}" not found`, bucket, String(key), error);
}

function isError(error: unknown): error is Error {
	return error instanceof Error;
}

function toError(error: unknown, context: string): Error {
	return new Error(`S3 operation failed for "${context}"`, { cause: error });
}
