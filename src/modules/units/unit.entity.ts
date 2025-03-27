import {
    Column,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Product } from '../products/product.entity'
import { UnitDto } from './unit.dto'
import { OrderProduct } from '../orders/order-product.entity'

@Entity()
export class Unit {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    name: string
    @Column({ nullable: true })
    weight?: number
    @Column({ nullable: true })
    fractionalWeight?: number
    @Column()
    price: number
    @Column({ default: true })
    enabled: boolean
    @DeleteDateColumn()
    deletedAt: Date
    @ManyToOne(() => Product, (product) => product.units)
    product: Product
    @ManyToOne(() => OrderProduct, (orderProduct) => orderProduct.unit)
    orders: OrderProduct[]

    toDto(): UnitDto {
        return {
            name: this.name,
            weight: this.weight,
            fractionalWeight: this.fractionalWeight,
            price: this.price,
            enabled: this.enabled,
        }
    }
}
