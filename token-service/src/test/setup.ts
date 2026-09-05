import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

process.env.JWT_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' });
process.env.JWT_ISSUER = 'test-issuer';
