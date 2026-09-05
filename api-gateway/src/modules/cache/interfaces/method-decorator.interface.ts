/* eslint-disable @typescript-eslint/no-explicit-any */

export type DecoratedMethod = (...args: any[]) => any;

export type MethodDecorator<T extends DecoratedMethod = DecoratedMethod> = (
	_target: object,
	_propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>;
