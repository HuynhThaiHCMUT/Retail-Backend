import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsOptional, ValidateNested } from "class-validator";
import { CreateOrderProductDto, OrderProductDto, UpdateOrderProductDto } from "./order-product.dto";
import { Type } from "class-transformer";
import { OrderStatus } from "src/utils/enum";

export class CreatePOSOrderDto {
    @ApiProperty({ type: () => [CreateOrderProductDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderProductDto)
    products: CreateOrderProductDto[];
}

export class CreateOnlineOrderDto extends CreatePOSOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    customerId?: string;
    @ApiPropertyOptional()
    @IsOptional()
    address?: string;
    @ApiPropertyOptional()
    @IsOptional()
    phone?: string;
    @ApiPropertyOptional()
    @IsOptional()
    email?: string;
    @ApiPropertyOptional()
    @IsOptional()
    customerName?: string;
}

export class OrderDto extends CreateOnlineOrderDto {
    @ApiProperty()
    id: string;
    @ApiProperty({enum: OrderStatus})
    status: string;
    @ApiProperty()
    total: number;
    @ApiProperty()
    createdAt: Date;
    @ApiProperty()
    updatedAt: Date;
    @ApiProperty()
    deletedAt: Date;
    @ApiProperty()
    staffId?: string;
    @ApiProperty({ type: () => [OrderProductDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderProductDto)
    products: OrderProductDto[];
}


export class UpdateOrderDto {
    @ApiPropertyOptional({enum: OrderStatus})
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: string;
    @ApiPropertyOptional()
    @IsOptional()
    address?: string;
    @ApiPropertyOptional()
    @IsOptional()
    phone?: string;
    @ApiPropertyOptional()
    @IsOptional()
    email?: string;
    @ApiPropertyOptional()
    @IsOptional()
    customerName?: string;
    @ApiPropertyOptional({ type: () => [UpdateOrderProductDto]})
    @IsOptional()
    products?: (CreateOrderProductDto | UpdateOrderProductDto)[];
}