import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AuditLog } from './audit-log.entity'
import { Repository } from 'typeorm'

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>
    ) {}

    async getLogs(module: string, id: string) {
        let auditLogs = await this.auditLogRepository.find({
            where: {
                module,
                recordId: id,
            },
            order: {
                changedAt: 'DESC',
            },
            relations: ['changedBy'],
        })
        return auditLogs.map((log) => log.toDto())
    }
}
