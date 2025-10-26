import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CategoryDto {
    @ApiProperty()
    @IsNotEmpty()
    id: string

    @ApiProperty()
    @IsNotEmpty()
    name: string

    @ApiProperty()
    @IsNotEmpty()
    productCount: number

    @ApiProperty()
    @IsNotEmpty()
    picture: string
}
