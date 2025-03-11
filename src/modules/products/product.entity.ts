import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    name: string
    @Column({default: false})
    deleted: boolean
    @Column({default: true})
    enabled: boolean
    @Column({nullable: true})
    description?: string
    @Column("int")
    price: number
    @Column("int", {nullable: true})
    basePrice?: number
    @Column("int", {default: 0})
    qty: number
    @Column("int", {nullable: true})
    minQty?: number
    @Column({nullable: true})
    barcode?: string
    @Column({nullable: true})
    baseUnit?: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    pictures?: string[];
}