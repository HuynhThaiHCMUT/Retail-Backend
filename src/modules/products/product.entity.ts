import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "../categories/category.entity";
import { OrderProduct } from "../orders/order-product.entity";
import { Audit } from "../audit-logs/audit.decorator";

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    @Audit()
    name: string
    @Column({default: true})
    enabled: boolean
    @Column({nullable: true})
    description?: string
    @Column("int")
    @Audit()
    price: number
    @Column("int", {nullable: true})
    @Audit()
    basePrice?: number
    @Column("int", {default: 0})
    quantity: number
    @Column("int", {nullable: true})
    minQuantity?: number
    @Column({nullable: true})
    @Audit()
    barcode?: string
    @Column({nullable: true})
    baseUnit?: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
    @ManyToMany(() => Category, category => category.products)
    @JoinTable()
    categories?: Category[];
    @OneToMany(() => OrderProduct, orderProduct => orderProduct.product)
    orders?: OrderProduct[];
    pictures?: string[];

    toDto() {
        return {...this, categories: this.categories?.map((category) => category.name)}
    }
}