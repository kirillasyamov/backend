export interface JwtConfig {
	privateKey: string;
	publicKey: string;
	issuer: string;
}

export const jwtConfig: JwtConfig = {
	get privateKey() {
		const key = process.env.JWT_PRIVATE_KEY;
		if (!key) throw new Error('JWT_PRIVATE_KEY is not set');
		return key.replace(/\\n/g, '\n');
	},
	get publicKey() {
		const key = process.env.JWT_PUBLIC_KEY;
		if (!key) throw new Error('JWT_PUBLIC_KEY is not set');
		return key.replace(/\\n/g, '\n');
	},
	get issuer() {
		return process.env.JWT_ISSUER ?? 'token-service';
	},
};
