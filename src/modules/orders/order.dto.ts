import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    Min,
    ValidateNested,
} from 'class-validator'
import {
    CreateOrderProductDto,
    OrderProductDto,
    UpdateOrderProductDto,
} from './order-product.dto'
import { Type } from 'class-transformer'
import { OrderStatus } from 'src/utils/enum'

export class CreatePOSOrderDto {
    @ApiProperty({ type: () => [CreateOrderProductDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderProductDto)
    products: CreateOrderProductDto[]
}

export class CreateOnlineOrderDto extends CreatePOSOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    customerId?: string
    @ApiPropertyOptional()
    @IsOptional()
    address?: string
    @ApiPropertyOptional()
    @IsOptional()
    phone?: string
    @ApiPropertyOptional()
    @IsOptional()
    email?: string
    @ApiPropertyOptional()
    @IsOptional()
    customerName?: string
}

export class OrderDto extends CreateOnlineOrderDto {
    @ApiProperty()
    id: string
    @ApiProperty()
    name: string
    @ApiProperty({ enum: OrderStatus })
    status: string
    @ApiProperty()
    total: number
    @ApiProperty()
    createdAt: Date
    @ApiProperty()
    updatedAt: Date
    @ApiProperty()
    staffId?: string
    @ApiProperty({ type: () => [OrderProductDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderProductDto)
    products: OrderProductDto[]
}

export class UpdateOrderDto {
    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: string
    @ApiPropertyOptional()
    @IsOptional()
    address?: string
    @ApiPropertyOptional()
    @IsOptional()
    phone?: string
    @ApiPropertyOptional()
    @IsOptional()
    email?: string
    @ApiPropertyOptional()
    @IsOptional()
    customerName?: string
    @ApiPropertyOptional({ type: () => [UpdateOrderProductDto] })
    @IsOptional()
    products?: (CreateOrderProductDto | UpdateOrderProductDto)[]
}

export class GetOrdersQueryDto {
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
    @Min(1)
    limit?: number = 10

    @ApiPropertyOptional({ enum: ['time', 'price-desc', 'price-asc'] })
    @IsOptional()
    @IsEnum(['time', 'price-desc', 'price-asc'])
    sortBy?: 'time' | 'price-desc' | 'price-asc'

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    totalFrom?: number

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    totalTo?: number

    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus
}
