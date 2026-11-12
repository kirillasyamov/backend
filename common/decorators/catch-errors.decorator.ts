export interface ErrorMapperContext<Args extends unknown[] = unknown[]> {
	operation: string;
	context: string;
	args: Args;
	instance: unknown;
}

export type ErrorMapper<Args extends unknown[] = unknown[]> = (error: unknown, ctx: ErrorMapperContext<Args>) => Error;

export interface CatchErrorsOptions<Args extends unknown[] = unknown[]> {
	mapper: ErrorMapper<Args>;
	buildContext?: (...args: Args) => string;
}

export function CatchErrors<Args extends unknown[] = unknown[]>(options: CatchErrorsOptions<Args>): MethodDecorator {
	return (_target, propertyKey, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value as (...args: Args) => unknown;
		const operationName = String(propertyKey);

		descriptor.value = function (this: unknown, ...args: Args) {
			const mapAndThrow = (error: unknown) => {
				throw mapCaughtError(error, this, operationName, args, options);
			};
			return callSafely(originalMethod, this, args, mapAndThrow);
		};
		return descriptor;
	};
}

function callSafely<Args extends unknown[]>(method: (...args: Args) => unknown, thisArg: unknown, args: Args, onError: (error: unknown) => never): unknown {
	try {
		const result = method.apply(thisArg, args);
		return isPromise(result) ? result.catch(onError) : result;
	} catch (error) {
		return onError(error);
	}
}

function isPromise(value: unknown): value is Promise<unknown> {
	return value instanceof Promise;
}

function mapCaughtError<Args extends unknown[]>(error: unknown, instance: unknown, operation: string, args: Args, options: CatchErrorsOptions<Args>): Error {
	const context = options.buildContext?.(...args) ?? '';
	return options.mapper(error, { operation, context, args, instance });
}
