import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from '../products/product.entity'

@Entity()
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column({ unique: true })
    name: string
    @ManyToMany(() => Product, (product) => product.categories)
    products?: Product[]
}
