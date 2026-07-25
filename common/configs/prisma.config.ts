export interface PrismaConfig {
	connectionString: string;
}

export const prismaConfig: PrismaConfig = {
	get connectionString() {
		return process.env.DATABASE_URL!;
	},
};
