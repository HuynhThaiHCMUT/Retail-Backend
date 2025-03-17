import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEmail, IsEnum, IsMobilePhone, IsNotEmpty, IsOptional } from "class-validator"
import { Role } from "src/utils/enum";

export class FileUploadDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;
}
  

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    name: string

    @ApiPropertyOptional()
    @IsOptional()
    password?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string

    @ApiProperty()
    @IsMobilePhone()
    phone: string

    @ApiPropertyOptional({enum: Role})
    @IsOptional()
    @IsEnum(Role)
    role?: string

    @ApiPropertyOptional()
    picture?: string
}

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty()
    name?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsMobilePhone()
    phone?: string

    @ApiPropertyOptional({enum: Role})
    @IsOptional()
    @IsEnum(Role)
    role?: string

    @ApiPropertyOptional()
    picture?: string
}

export class UserDto extends CreateUserDto {
    @ApiProperty()
    id: string
    @ApiProperty()
    createdAt: Date
    @ApiProperty()
    updatedAt: Date
}