import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common'
import { AuditLogsService } from './audit-logs.service'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AuditLogDto, GetAuditLogsQueryDto } from './audit-log.dto'
import { Staff } from '../auth/auth.guard'

@Controller('audit-logs')
@ApiBearerAuth()
@ApiTags('audit-logs')
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) {}

    @Staff()
    @Get(':module/:id')
    @ApiOkResponse({
        description: 'Get audit logs successfully',
        type: [AuditLogDto],
    })
    async getLogsForEntity(
        @Param('module') module: string,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true }))
        query: GetAuditLogsQueryDto
    ) {
        return this.auditLogsService.getLogsForEntity(
            module,
            id,
            query.limit,
            query.offset
        )
    }

    @Staff()
    @Get()
    @ApiOkResponse({
        description: 'Get audit logs successfully',
        type: [AuditLogDto],
    })
    async getLogs(
        @Query(new ValidationPipe({ transform: true }))
        query: GetAuditLogsQueryDto
    ) {
        return this.auditLogsService.getLogs(
            query.module,
            query.limit,
            query.offset
        )
    }
}
