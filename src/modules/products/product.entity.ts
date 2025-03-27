import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Category } from '../categories/category.entity'
import { OrderProduct } from '../orders/order-product.entity'
import { Audit } from '../audit-logs/audit.decorator'
import { Unit } from '../units/unit.entity'
import { ProductDto } from './product.dto'

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    @Audit()
    name: string
    @Column({ default: true })
    enabled: boolean
    @Column({ nullable: true })
    description?: string
    @Column('int')
    @Audit()
    price: number
    @Column('int', { nullable: true })
    @Audit()
    basePrice?: number
    @Column('int', { default: 0 })
    quantity: number
    @Column('int', { nullable: true })
    minQuantity?: number
    @Column({ nullable: true })
    @Audit()
    barcode?: string
    @Column({ nullable: true })
    baseUnit?: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
    @ManyToMany(() => Category, (category) => category.products)
    @JoinTable()
    categories?: Category[]
    @OneToMany(() => Unit, (unit) => unit.product)
    units?: Unit[]
    @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
    orders?: OrderProduct[]

    toDto(pictures: string[] = []): ProductDto {
        return {
            id: this.id,
            name: this.name,
            enabled: this.enabled,
            description: this.description,
            price: this.price,
            basePrice: this.basePrice,
            quantity: this.quantity,
            minQuantity: this.minQuantity,
            barcode: this.barcode,
            baseUnit: this.baseUnit,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            categories: this.categories?.map((category) => category.name),
            units: this.units?.map((unit) => unit.toDto()),
            pictures,
        }
    }
}
