import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsMobilePhone, IsNotEmpty, IsOptional, MinLength } from "class-validator";

export class SignInDto {
    @ApiProperty()
    @IsMobilePhone()
    phone: string;

    @ApiProperty({ minLength: 8 })
    @MinLength(8)
    password: string;
}

export class SignUpDto {
    @ApiProperty()
    @IsNotEmpty()
    name: string

    @ApiProperty({ minLength: 8 })
    @MinLength(8)
    password: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string

    @ApiProperty()
    @IsMobilePhone()
    phone: string
}

export class AuthDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    name: string;
    @ApiProperty()
    role: string;
    @ApiProperty()
    phone: string;
    @ApiPropertyOptional()
    email?: string;
    @ApiProperty()
    token: string;
}