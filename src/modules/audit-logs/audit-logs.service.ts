import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AuditLog } from './audit-log.entity'
import { Repository, DataSource, In } from 'typeorm'

import { Product } from '../products/product.entity'
import { Order } from '../orders/order.entity'

@Injectable()
export class AuditLogsService {
    private readonly logger = new Logger(AuditLogsService.name)
    private readonly MODULE_ENTITY_MAP: Record<string, any> = {
        Product: Product,
        Order: Order,
    }

    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        private readonly dataSource: DataSource
    ) {}

    async getLogsForEntity(
        module: string,
        id: string,
        limit?: number,
        offset?: number
    ) {
        const [auditLogs, totalCount] =
            await this.auditLogRepository.findAndCount({
                where: {
                    module,
                    recordId: id,
                },
                order: {
                    changedAt: 'DESC',
                },
                relations: ['changedBy'],
                take: limit,
                skip: offset,
            })

        const items = await this.attachCurrentRecords(module, auditLogs)
        return {
            items,
            totalCount,
        }
    }

    async getLogs(module?: string, limit?: number, offset?: number) {
        const where: any = {}
        if (module) {
            where.module = module
        }

        const [auditLogs, totalCount] =
            await this.auditLogRepository.findAndCount({
                where,
                order: {
                    changedAt: 'DESC',
                },
                relations: ['changedBy'],
                take: limit,
                skip: offset,
            })

        const items = await this.attachCurrentRecords(module, auditLogs)
        return {
            items,
            totalCount,
        }
    }

    private async attachCurrentRecords(
        moduleArg: string | undefined,
        logs: AuditLog[]
    ) {
        const byModule = new Map<string, string[]>()
        for (const l of logs) {
            const mod = moduleArg ?? l.module
            if (!byModule.has(mod)) byModule.set(mod, [])
            byModule.get(mod)!.push(l.recordId)
        }

        const recordsByModuleAndId = new Map<string, Map<string, any>>()
        for (const [mod, ids] of byModule.entries()) {
            const uniqueIds = Array.from(new Set(ids))
            const entityClass = this.MODULE_ENTITY_MAP[mod]
            if (!entityClass) {
                continue
            }
            const repo = this.dataSource.getRepository(entityClass)
            const found = await repo.find({
                where: { id: In(uniqueIds) } as any,
            })
            const map = new Map<string, any>()
            for (const r of found) map.set(String((r as any).id), r)
            recordsByModuleAndId.set(mod, map)
        }

        return logs.map((log) => {
            const dto = log.toDto()
            const mod = moduleArg ?? log.module
            const map = recordsByModuleAndId.get(mod)
            const currentRecord = map?.get(log.recordId) ?? null
            return {
                ...dto,
                currentRecord,
            }
        })
    }
}
