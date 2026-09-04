export * from './modules/config';
export * from './modules/prisma';
export * from './modules/redis';
export * from './modules/s3-client';
export * from './enums';
export * from './decorators';

import { fileURLToPath } from 'node:url';

const resolveProtoPath = (name: string): string => fileURLToPath(import.meta.resolve(`@kirillasyamov/common/contracts/proto/${name}.proto`));

export const userProtoPath = resolveProtoPath('user');
export const authProtoPath = resolveProtoPath('auth');
export const tokenProtoPath = resolveProtoPath('token');
export const mediaProtoPath = resolveProtoPath('media');
export const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));
