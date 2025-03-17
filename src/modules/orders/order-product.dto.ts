import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrderProductDto {
    @ApiProperty()
    productId: string;
    @ApiProperty()
    quantity: number;
    @ApiPropertyOptional()
    price?: number;
}

export class OrderProductDto extends CreateOrderProductDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    price: number;
    @ApiProperty()
    total: number;
}

export class UpdateOrderProductDto {
    @ApiProperty()
    id: string;
    @ApiPropertyOptional()
    productId?: string;
    @ApiPropertyOptional()
    quantity?: number;
    @ApiPropertyOptional()
    price?: number;
}