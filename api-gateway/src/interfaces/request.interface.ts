export interface IRequestWithUser {
	headers?: { authorization?: string };
	user?: unknown;
}
