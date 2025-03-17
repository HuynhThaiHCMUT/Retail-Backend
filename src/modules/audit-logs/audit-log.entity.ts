import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column()
    module: string;
    @Column()
    recordId: string;
    @Column()
    fieldName: string;
    @Column('text', { nullable: true })
    oldValue: string | null;
    @Column('text', { nullable: true })
    newValue: string | null;
    @ManyToOne(() => User, user => user.auditLogs, { nullable: true })
    changedBy: User;
    @CreateDateColumn()
    changedAt: Date;

    toDto() {
        return {
            ...this,
            changedBy: this.changedBy.name,
        }
    }
}
