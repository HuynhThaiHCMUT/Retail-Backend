import { Controller, Get, Param } from '@nestjs/common'
import { AuditLogsService } from './audit-logs.service'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AuditLogDto } from './audit-log.dto'
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
    async getLogs(@Param('module') module: string, @Param('id') id: string) {
        return this.auditLogsService.getLogs(module, id)
    }
}
