import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional } from "class-validator"

export class FilesUploadDto {
    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    files: any[];
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
    qty?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    minQty?: number

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
    qty?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    minQty?: number

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
    createdAt: Date

    @ApiProperty()
    updatedAt: Date
}