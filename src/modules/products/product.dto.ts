import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator'
import { UnitDto } from '../units/unit.dto'
import { Type } from 'class-transformer'

export class FilesUploadDto {
    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    files: any[]
}

export class CreateProductDto {
    @ApiProperty()
    @IsNotEmpty()
    name: string

    @ApiPropertyOptional()
    @IsOptional()
    description?: string

    @ApiPropertyOptional()
    @IsOptional()
    categories?: string[]

    @ApiPropertyOptional({ type: [UnitDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UnitDto)
    units?: UnitDto[]

    @ApiProperty()
    @IsInt()
    price: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    basePrice?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    quantity?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    minQuantity?: number

    @ApiPropertyOptional()
    @IsOptional()
    barcode?: string

    @ApiPropertyOptional()
    @IsOptional()
    baseUnit?: string
}

export class UpdateProductDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty()
    name?: string

    @ApiPropertyOptional()
    @IsOptional()
    description?: string

    @ApiPropertyOptional()
    @IsOptional()
    categories?: string[]

    @ApiPropertyOptional({ type: [UnitDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UnitDto)
    units?: UnitDto[]

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    price?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    basePrice?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    quantity?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    minQuantity?: number

    @ApiPropertyOptional()
    @IsOptional()
    barcode?: string

    @ApiPropertyOptional()
    @IsOptional()
    baseUnit?: string

    @ApiPropertyOptional()
    @IsOptional()
    enabled?: boolean
}

export class ProductDto extends CreateProductDto {
    @ApiProperty()
    id: string

    @ApiProperty()
    enabled: boolean

    @ApiProperty()
    pictures: string[]

    @ApiProperty()
    createdAt: Date

    @ApiProperty()
    updatedAt: Date
}

export class GetProductsQueryDto {
    @ApiPropertyOptional({ type: Number, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0

    @ApiPropertyOptional({ type: Number, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    limit?: number = 10

    @ApiPropertyOptional({ enum: ['time', 'price-desc', 'price-asc'] })
    @IsOptional()
    @IsEnum(['time', 'price-desc', 'price-asc'])
    sortBy?: 'time' | 'price-desc' | 'price-asc'

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    name?: string

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    priceFrom?: number

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    priceTo?: number

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    categories?: string
}
