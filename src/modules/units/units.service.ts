import { Injectable, Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Unit } from './unit.entity'
import { UnitDto } from './unit.dto'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class UnitsService {
    private readonly logger = new Logger(UnitsService.name)

    constructor(
        @InjectRepository(Unit)
        private readonly unitsRepository: Repository<Unit>
    ) {}

    async createFromArray(
        data: UnitDto[],
        productId: string = null
    ): Promise<Unit[]> {
        if (!data) return []
        if (!productId) return this.unitsRepository.save(data)

        const existingUnits = await this.unitsRepository.find({
            where: { product: { id: productId } },
        })

        const unitMap = new Map(existingUnits.map((unit) => [unit.name, unit]))

        const newUnits: Unit[] = []
        const updatedUnits: Unit[] = []

        for (const unitDto of data) {
            const existingUnit = unitMap.get(unitDto.name)

            if (existingUnit) {
                existingUnit.weight = unitDto.weight
                existingUnit.price = unitDto.price
                existingUnit.fractionalWeight = unitDto.fractionalWeight
                existingUnit.enabled = unitDto.enabled
                updatedUnits.push(existingUnit)
            } else {
                newUnits.push(
                    this.unitsRepository.create({
                        ...unitDto,
                        product: { id: productId },
                    })
                )
            }
        }

        const savedNewUnits = await this.unitsRepository.save(newUnits)
        const savedUpdatedUnits = await this.unitsRepository.save(updatedUnits)

        return [...savedNewUnits, ...savedUpdatedUnits]
    }

    async deleteByProductId(productId: string): Promise<void> {
        await this.unitsRepository.softDelete({ product: { id: productId } })
    }
}
