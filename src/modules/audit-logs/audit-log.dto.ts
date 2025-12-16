import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, IsString } from 'class-validator'

export class GetAuditLogsQueryDto {
    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    module?: string

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
}

export class AuditLogDto {
    @ApiProperty()
    id: string
    @ApiProperty()
    module: string
    @ApiProperty()
    recordId: string
    @ApiProperty()
    fieldName: string
    @ApiProperty()
    oldValue: string
    @ApiProperty()
    newValue: string
    @ApiProperty()
    changedBy: string
    @ApiProperty()
    changedAt: Date
    @ApiProperty()
    currentRecord?: any
}
