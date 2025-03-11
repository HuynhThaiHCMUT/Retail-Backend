import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum Role {
    MANAGER = "MANAGER",
    EMPLOYEE = "EMPLOYEE",
    CUSTOMER = "CUSTOMER"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    name: string
    @Column({default: false})
    deleted: boolean
    @Column({nullable: true})
    email: string
    @Column({length: 15, unique: true})
    phone: string
    @Column({type: "enum", enum: Role})
    role: string
    @Column({nullable: true})
    picture: string
    @Column()
    password: string
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
}