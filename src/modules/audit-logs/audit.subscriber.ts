import {
    EventSubscriber,
    EntitySubscriberInterface,
    UpdateEvent,
    RemoveEvent,
    DataSource,
} from 'typeorm'
import { AuditLog } from './audit-log.entity'
import { getAuditedFields } from './audit.decorator'
import { Logger } from '@nestjs/common'
import { User } from '../users/user.entity'

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    private readonly logger = new Logger(AuditSubscriber.name)

    constructor(private dataSource: DataSource) {
        dataSource.subscribers.push(this)
    }

    async afterUpdate(event: UpdateEvent<any>) {
        const { entity, databaseEntity, manager } = event
        if (!entity) return

        const auditedFields = getAuditedFields(entity)
        if (auditedFields.length === 0) return

        if (!entity.updatedBy) return
        const userRepo = this.dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: entity.updatedBy } })
        if (!user) return

        const logs: AuditLog[] = []

        for (const field of auditedFields) {
            const oldValue = databaseEntity[field]
            const newValue = entity[field]

            if (oldValue !== newValue) {
                const log = new AuditLog()
                log.module = entity.constructor.name
                log.recordId = entity.id
                log.fieldName = field
                log.oldValue = oldValue
                log.newValue = newValue
                log.changedBy = user
                logs.push(log)
            }
        }

        if (logs.length > 0) {
            await manager.getRepository(AuditLog).save(logs)
        }
    }

    async afterRemove(event: RemoveEvent<any>) {
        const { entity, manager } = event
        if (!entity) return

        const auditedFields = getAuditedFields(entity)
        if (auditedFields.length === 0) return

        const logs: AuditLog[] = []

        for (const field of auditedFields) {
            const log = new AuditLog()
            log.module = entity.constructor.name
            log.recordId = entity.id
            log.fieldName = field
            log.oldValue = entity[field]
            log.newValue = null // Deleted
            log.changedBy = event.queryRunner.data?.userId ?? 'Unknown'

            logs.push(log)
        }

        if (logs.length > 0) {
            await manager.getRepository(AuditLog).save(logs)
        }
    }
}
