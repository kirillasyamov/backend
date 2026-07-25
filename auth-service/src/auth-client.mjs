import { loadSync } from '@grpc/proto-loader';
import { loadPackageDefinition, credentials } from '@grpc/grpc-js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PROTO_PATH = join(__dirname, '../common/contracts/proto/auth.proto');
const SERVER_URL = process.env.GRPC_URL || 'localhost:50002';

const packageDef = loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});

const proto = loadPackageDefinition(packageDef);
const authService = new proto.auth.v1.AuthService(SERVER_URL, credentials.createInsecure());

function createAccount(data) {
	return new Promise((resolve, reject) => {
		authService.CreateAccount(data, (err, response) => {
			if (err) return reject(err);
			resolve(response);
		});
	});
}

function createSession(data) {
	return new Promise((resolve, reject) => {
		authService.CreateSession(data, (err, response) => {
			if (err) return reject(err);
			resolve(response);
		});
	});
}

function getSessions(accountId) {
	return new Promise((resolve, reject) => {
		authService.GetSessions({ accountId }, (err, response) => {
			if (err) return reject(err);
			resolve(response);
		});
	});
}

function deleteAccount(id) {
	return new Promise((resolve, reject) => {
		authService.DeleteAccount({ id }, (err, response) => {
			if (err) return reject(err);
			resolve(response);
		});
	});
}

function randomString(len = 8) {
	return Math.random().toString(36).substring(2, 2 + len);
}

async function main() {
	console.log(`Connecting to gRPC server at ${SERVER_URL}\n`);

	const login = `user_${randomString()}`;
	const email = `${randomString()}@test.com`;
	const password = `Pass_${randomString(12)}!`;

	console.log('--- CreateAccount ---');
	const account = await createAccount({ login, email, password });
	console.log('Account:', JSON.stringify(account, null, 2));

	console.log('\n--- CreateSession ---');
	const session = await createSession({
		accountId: account.accountId,
		roleId: account.roleId,
		password,
		device: 'test-client/1.0',
	});
	console.log('Session:', JSON.stringify(session, null, 2));

	console.log('\n--- GetSessions ---');
	const sessions = await getSessions(account.accountId);
	console.log('Sessions:', JSON.stringify(sessions, null, 2));

	console.log('\n--- Cleanup: DeleteAccount ---');
	await deleteAccount({ id: account.accountId });
	console.log('Account deleted');
}

main().catch(console.error);
