import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Order } from '../orders/order.entity'
import { Role } from 'src/utils/enum'
import { AuditLog } from '../audit-logs/audit-log.entity'

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    name: string
    @Column({ nullable: true })
    email: string
    @Column({ length: 15, unique: true })
    phone: string
    @Column({ type: 'enum', enum: Role })
    role: string
    @Column({ nullable: true })
    picture: string
    @Column()
    password: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
    @OneToMany(() => Order, (order) => order.customer)
    customerOrders: Order[]
    @OneToMany(() => Order, (order) => order.staff)
    staffOrders: Order[]
    @OneToMany(() => AuditLog, (auditLog) => auditLog.changedBy)
    auditLogs: AuditLog[]

    toDto() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            role: this.role,
            picture: this.picture,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }
}
