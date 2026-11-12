export interface QueueConfig {
	resetIntervalMs: number;
}

export const queueConfig: QueueConfig = {
	get resetIntervalMs() {
		const minutes = Number(process.env.RESET_INTERVAL_MINUTES);
		return (Number.isFinite(minutes) && minutes > 0 ? minutes : 10) * 60 * 1000;
	},
};
