import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    ValidateIf,
} from 'class-validator'

export class UnitDto {
    @ApiProperty()
    @IsNotEmpty()
    name: string
    @ApiPropertyOptional()
    @ValidateIf((obj) => obj.fractionalWeight === undefined)
    @IsNumber()
    weight?: number
    @ApiPropertyOptional()
    @ValidateIf((obj) => obj.weight === undefined)
    @IsNumber()
    fractionalWeight?: number
    @ApiProperty()
    @IsNumber()
    price: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enabled: boolean
}
