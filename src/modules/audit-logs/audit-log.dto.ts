import { ApiProperty } from "@nestjs/swagger";

export class AuditLogDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    module: string;
    @ApiProperty()
    recordId: string;
    @ApiProperty()
    fieldName: string;
    @ApiProperty()
    oldValue: string;
    @ApiProperty()
    newValue: string;
    @ApiProperty()
    changedBy: string;
    @ApiProperty()
    changedAt: Date;
}