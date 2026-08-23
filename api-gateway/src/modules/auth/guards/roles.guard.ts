import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}
	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
		if (!requiredRoles?.length) return true;

		const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
		if (!request.user?.role || !requiredRoles.includes(request.user.role)) {
			throw new ForbiddenException('Insufficient permissions');
		}
		return true;
	}
}
