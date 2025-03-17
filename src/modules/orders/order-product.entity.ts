import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../products/product.entity";
import { Order } from "./order.entity";
import { OrderProductDto } from "./order-product.dto";

@Entity()
export class OrderProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @ManyToOne(() => Order, order => order.products)
    order: Order;
    @ManyToOne(() => Product, product => product.orders)
    product: Product;
    @Column('int')
    quantity: number;
    @Column('int')
    price: number;
    @Column('int')
    total: number;

    toDto() {
        return {
            ...this,
            productId: this.product?.id,
        };
    }
}