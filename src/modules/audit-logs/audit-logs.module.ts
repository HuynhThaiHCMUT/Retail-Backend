import { Module } from '@nestjs/common'
import { AuditLogsController } from './audit-logs.controller'
import { AuditLogsService } from './audit-logs.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLog } from './audit-log.entity'

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    controllers: [AuditLogsController],
    providers: [AuditLogsService],
    exports: [AuditLogsService],
})
export class AuditLogsModule {}
