export interface JwtConfig {
	privateKey: string;
	publicKey: string;
	issuer: string;
}

export const jwtConfig: JwtConfig = {
	get privateKey() {
		return process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');
	},
	get publicKey() {
		return process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n');
	},
	get issuer() {
		return process.env.JWT_ISSUER ?? 'token-service';
	},
};
