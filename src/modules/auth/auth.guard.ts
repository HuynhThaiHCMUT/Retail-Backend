import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { Request } from 'express'
import { AUTH_ERRORS } from 'src/error/auth.error'
import { Role } from 'src/utils/enum'
import { RequestContext } from 'src/utils/request-context'

export const IS_PUBLIC_KEY = 'isPublic'
export const IS_ADMIN_KEY = 'isAdmin'
export const IS_ADMIN_OR_SELF_KEY = 'isAdminOrSelf'
export const IS_STAFF = 'isStaff'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
export const Admin = () => SetMetadata(IS_ADMIN_KEY, true)
export const AdminOrSelf = () => SetMetadata(IS_ADMIN_OR_SELF_KEY, true)
export const Staff = () => SetMetadata(IS_STAFF, true)

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private reflector: Reflector,
        private readonly requestContext: RequestContext
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        )

        if (isPublic) {
            this.requestContext.run(() => {}, { userId: null })
            return true
        }

        const request = context.switchToHttp().getRequest<Request>()
        const token = this.extractTokenFromHeader(request)

        if (!token) {
            throw new UnauthorizedException(AUTH_ERRORS.MISSING_TOKEN_ERROR)
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            })
            request['user'] = payload
            this.requestContext.run(() => {}, { userId: payload.id })
        } catch (error) {
            if (error instanceof TokenExpiredError)
                throw new UnauthorizedException(AUTH_ERRORS.EXPIRED_TOKEN_ERROR)
            throw new UnauthorizedException(AUTH_ERRORS.INVALID_TOKEN_ERROR)
        }

        const isStaff = this.reflector.getAllAndOverride<boolean>(IS_STAFF, [
            context.getHandler(),
            context.getClass(),
        ])
        if (isStaff) {
            if (
                request['user']?.role === Role.EMPLOYEE ||
                request['user']?.role === Role.MANAGER
            ) {
                return true
            }
            throw new ForbiddenException(AUTH_ERRORS.NOT_STAFF_ERROR)
        }

        const isAdminOrSelf = this.reflector.getAllAndOverride<boolean>(
            IS_ADMIN_OR_SELF_KEY,
            [context.getHandler(), context.getClass()]
        )
        if (isAdminOrSelf) {
            const user = request['user']
            const userId = request.params.id

            if (!user) {
                throw new ForbiddenException(AUTH_ERRORS.MISSING_USER_ERROR)
            }

            const isAdmin = user.role === Role.MANAGER
            const isSelf = user.id === parseInt(userId, 10)

            if (isAdmin || isSelf) {
                return true
            }

            throw new ForbiddenException(AUTH_ERRORS.NOT_ADMIN_SELF_ERROR)
        }

        const isAdmin = this.reflector.getAllAndOverride<boolean>(
            IS_ADMIN_KEY,
            [context.getHandler(), context.getClass()]
        )
        if (isAdmin) {
            if (request['user']?.role === Role.MANAGER) {
                return true
            }
            throw new ForbiddenException(AUTH_ERRORS.NOT_ADMIN_ERROR)
        }

        return true
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}
