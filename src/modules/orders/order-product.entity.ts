import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from '../products/product.entity'
import { Order } from './order.entity'
import { OrderProductDto } from './order-product.dto'
import { Unit } from '../units/unit.entity'

@Entity()
export class OrderProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @ManyToOne(() => Order, (order) => order.products)
    order: Order
    @ManyToOne(() => Product, (product) => product.orders)
    product: Product
    @ManyToOne(() => Unit, (unit) => unit.orders, { nullable: true })
    unit?: Unit
    @Column('int')
    quantity: number
    @Column('int')
    price: number
    @Column('int')
    total: number

    toDto(): OrderProductDto {
        return {
            id: this.id,
            quantity: this.quantity,
            price: this.price,
            total: this.total,
            productId: this.product?.id,
            unitName: this.unit?.name,
        }
    }
}
