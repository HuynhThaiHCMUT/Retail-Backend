import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { User } from '../users/user.entity'
import { OrderProduct } from './order-product.entity'
import { OrderStatus } from 'src/utils/enum'
import { OrderDto } from './order.dto'
import { Audit } from '../audit-logs/audit.decorator'

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column({ default: '' })
    name: string
    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    @Audit()
    status: string
    @Column('int')
    total: number
    @Column({ nullable: true })
    @Audit()
    address: string
    @Column({ nullable: true })
    @Audit()
    phone: string
    @Column({ nullable: true })
    @Audit()
    email: string
    @Column({ nullable: true })
    @Audit()
    customerName: string
    @Column({ nullable: true })
    updatedBy?: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
    @ManyToOne(() => User, (user) => user.customerOrders)
    customer: User
    @ManyToOne(() => User, (user) => user.staffOrders)
    staff: User
    @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
    products: OrderProduct[]

    constructor() {
        this.total = 0
        this.status = OrderStatus.PENDING
    }

    toDto(): OrderDto {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            total: this.total,
            address: this.address,
            phone: this.phone,
            email: this.email,
            customerName: this.customerName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            customerId: this.customer?.id,
            staffId: this.staff?.id,
            products: this.products?.map((orderProduct) =>
                orderProduct.toDto()
            ),
        }
    }
}
