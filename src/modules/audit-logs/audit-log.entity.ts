import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToMany,
    ManyToOne,
} from 'typeorm'
import { User } from '../users/user.entity'
import { AuditLogDto } from './audit-log.dto'

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    module: string
    @Column()
    recordId: string
    @Column()
    fieldName: string
    @Column('text', { nullable: true })
    oldValue: string | null
    @Column('text', { nullable: true })
    newValue: string | null
    @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
    changedBy: User
    @CreateDateColumn()
    changedAt: Date

    toDto(): AuditLogDto {
        return {
            id: this.id,
            module: this.module,
            recordId: this.recordId,
            fieldName: this.fieldName,
            oldValue: this.oldValue,
            newValue: this.newValue,
            changedAt: this.changedAt,
            changedBy: this.changedBy.name,
        }
    }
}
