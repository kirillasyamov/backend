export interface AuthConfig {
	expDays: number;
}

export const authConfig: AuthConfig = {
	get expDays() {
		return Number(process.env.EXP_DAYS) || 30;
	},
};
