import { IsIn, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export type RangeType = 'day' | 'week' | 'month'
export type MetricType = 'revenue' | 'profit' | 'orders' | 'products'

export class SummaryQueryDto {
    @IsOptional()
    @IsIn(['day', 'week', 'month'])
    @Type(() => String)
    @ApiPropertyOptional({
        enum: ['day', 'week', 'month'],
        default: 'month',
    })
    range: RangeType = 'month'

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description:
            'Date string (ISO or Date.toString()) that picks which day/week/month to use. If omitted -> now.',
        example: '2025-09-20T00:00:00.000Z',
    })
    date?: string
}

export class ChartQueryDto {
    @IsIn(['revenue', 'profit', 'orders', 'products'])
    @Type(() => String)
    @ApiProperty({ enum: ['revenue', 'profit', 'orders', 'products'] })
    metric: MetricType

    @IsOptional()
    @IsIn(['day', 'week', 'month'])
    @Type(() => String)
    @ApiPropertyOptional({
        enum: ['day', 'week', 'month'],
        default: 'month',
    })
    range: RangeType = 'month'

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description:
            'Date string (ISO or Date.toString()) that picks which day/week/month to use. If omitted -> now.',
        example: '2025-09-20T00:00:00.000Z',
    })
    date?: string
}

export class SummaryResponseDto {
    @ApiProperty({ example: 245000 })
    revenue: number

    @ApiProperty({ example: 82000 })
    profit: number

    @ApiProperty({ example: 18 })
    ordersCount: number

    @ApiProperty({ example: 43 })
    productsCount: number
}

export class ChartItemDto {
    @ApiProperty({ example: 'Mon' })
    label: string

    @ApiProperty({ example: 120 })
    value: number
}

export class TopSoldItemDto {
    @ApiProperty({ example: 101 })
    productId: number

    @ApiProperty({ example: 'Product Name' })
    productName: string

    @ApiProperty({ example: 25 })
    amountSold: number
}
