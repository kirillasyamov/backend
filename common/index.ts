export * from './modules/config';
export * from './modules/prisma';
export * from './modules/redis';
export * from './enums';

import { fileURLToPath } from 'node:url';

const resolveProtoPath = (name: string): string => fileURLToPath(import.meta.resolve(`@kirillasyamov/common/contracts/proto/${name}.proto`));

export const userProtoPath = resolveProtoPath('user');
export const authProtoPath = resolveProtoPath('auth');
export const tokenProtoPath = resolveProtoPath('token');
export const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));
