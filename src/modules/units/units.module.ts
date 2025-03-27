import { Module } from '@nestjs/common'
import { UnitsService } from './units.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Unit } from './unit.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Unit])],
    providers: [UnitsService],
    exports: [UnitsService],
})
export class UnitsModule {}
