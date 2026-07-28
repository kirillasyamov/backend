export interface AuthConfig {
	expDays: number;
	ttlSeconds: number;
}

export const authConfig: AuthConfig = {
	get expDays() {
		return Number(process.env.EXP_DAYS) || 30;
	},
	get ttlSeconds() {
		return this.expDays * 24 * 60 * 60;
	},
};
