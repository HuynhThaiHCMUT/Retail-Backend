import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from '../orders/order.entity'
import { OrderProduct } from '../orders/order-product.entity'
import { Product } from '../products/product.entity'
import { Unit } from '../units/unit.entity'
import { getRangeForFilter, toLocalTz } from 'src/utils/date-range'
import { RangeType, MetricType, TopSoldItemDto } from './reports.dto'

type ChartItem = { label: string; value: number }

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name)

    constructor(
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(OrderProduct)
        private opRepo: Repository<OrderProduct>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(Unit) private unitRepo: Repository<Unit>
    ) {}

    /**
     * Summary: revenue, profit, ordersCount, productsCount
     * Accepts range ('day'|'week'|'month') and optional date string to pick which period.
     */
    async getSummary(range: RangeType = 'month', date?: string) {
        const { start, end } = getRangeForFilter(range, date)

        const revenueRow = await this.orderRepo
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.total),0)', 'revenue')
            .addSelect('COUNT(DISTINCT order.id)', 'ordersCount')
            .where('order.createdAt BETWEEN :start AND :end', {
                start,
                end,
            })
            .andWhere('order.deletedAt IS NULL')
            .getRawOne()

        const revenue = Number(revenueRow?.revenue ?? 0)
        const ordersCount = Number(revenueRow?.ordersCount ?? 0)

        const profitExpr = this.profitExpression()
        const amountExpr = this.amountExpression()

        const row = await this.opRepo
            .createQueryBuilder('op')
            .select(`COALESCE(SUM((${profitExpr}) * op.quantity),0)`, 'profit')
            .addSelect(
                `COALESCE(SUM((${amountExpr}) * op.quantity),0)`,
                'productsCount'
            )
            .innerJoin('op.order', 'order')
            .innerJoin('op.product', 'product')
            .leftJoin('op.unit', 'unit')
            .where('order.createdAt BETWEEN :start AND :end', {
                start,
                end,
            })
            .andWhere('order.deletedAt IS NULL')
            .getRawOne()

        const profit = Number(row?.profit ?? 0)
        const productsCount = Number(row?.productsCount ?? 0)

        return { revenue, profit, ordersCount, productsCount }
    }

    /**
     * Return top 10 sold products within the given range.
     * Each item: { productId, name, amountSold }
     */
    async getTopSold(
        range: RangeType = 'month',
        date?: string
    ): Promise<TopSoldItemDto[]> {
        const { start, end } = getRangeForFilter(range, date)
        const amountExpr = this.amountExpression()

        const rows = await this.opRepo
            .createQueryBuilder('op')
            .select('product.id', 'productId')
            .addSelect('product.name', 'productName')
            .addSelect(
                `COALESCE(SUM((${amountExpr}) * op.quantity), 0)`,
                'amountSold'
            )
            .innerJoin('op.order', 'order')
            .innerJoin('op.product', 'product')
            .leftJoin('op.unit', 'unit')
            .where('order.createdAt BETWEEN :start AND :end', { start, end })
            .andWhere('order.deletedAt IS NULL')
            .groupBy('product.id')
            .addGroupBy('product.name')
            .orderBy('amountSold', 'DESC')
            .limit(10)
            .getRawMany()

        return rows.map((r) => ({
            productId: r.productId,
            productName: r.productName,
            amountSold: Number(r.amountSold),
        }))
    }

    /**
     * Chart data: returns array of { label, value }
     * - range: 'day' -> 24 hours (0..23)
     * - range: 'week' -> Mon..Sun
     * - range: 'month' -> days of month 1..N
     */
    async getChart(
        metric: MetricType,
        range: RangeType = 'month',
        date?: string
    ): Promise<ChartItem[]> {
        const { start, end } = getRangeForFilter(range, date)

        const profitExpr = this.profitExpression()
        const amountExpr = this.amountExpression()

        // choose aggregator depending on metric (orders/revenue from orders table, others from order_products)
        if (range === 'day') {
            return this.buildDayChart(
                metric,
                start,
                end,
                profitExpr,
                amountExpr
            )
        }

        if (range === 'week') {
            return this.buildWeekChart(
                metric,
                start,
                end,
                profitExpr,
                amountExpr
            )
        }

        // month
        return this.buildMonthChart(metric, start, end, profitExpr, amountExpr)
    }

    private profitExpression(): string {
        return `
            CASE
                WHEN unit.id IS NULL THEN (op.price - COALESCE(product.basePrice,0))
                ELSE (
                    CASE
                        WHEN unit.weight IS NOT NULL THEN (op.price - COALESCE(product.basePrice,0) * unit.weight)
                        WHEN unit.fractionalWeight IS NOT NULL AND unit.fractionalWeight <> 0 THEN (op.price - COALESCE(product.basePrice,0) / unit.fractionalWeight)
                        ELSE (op.price - COALESCE(product.basePrice,0))
                    END
                )
            END
        `
    }

    private amountExpression(): string {
        return `
            CASE
                WHEN unit.id IS NULL THEN 1
                ELSE (
                    CASE
                        WHEN unit.weight IS NOT NULL THEN unit.weight
                        WHEN unit.fractionalWeight IS NOT NULL AND unit.fractionalWeight <> 0 THEN (1.0 / unit.fractionalWeight)
                        ELSE 1
                    END
                )
            END
        `
    }

    private async buildDayChart(
        metric: MetricType,
        start: string,
        end: string,
        profitExpr: string,
        amountExpr: string
    ): Promise<ChartItem[]> {
        const buckets = Array.from({ length: 24 }, (_, i) => i)
        if (metric === 'revenue' || metric === 'orders') {
            const qb = this.orderRepo
                .createQueryBuilder('order')
                .select(`HOUR(${toLocalTz('order.createdAt')})`, 'hour')
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('hour')

            if (metric === 'revenue') {
                qb.addSelect('COALESCE(SUM(order.total),0)', 'value')
            } else {
                qb.addSelect('COUNT(DISTINCT order.id)', 'value')
            }

            const rows = await qb.getRawMany()
            const map = new Map<number, number>(
                rows.map((r) => [Number(r.hour), Number(r.value)])
            )

            return buckets.map((h) => ({
                label: `${h}:00`,
                value: map.get(h) ?? 0,
            }))
        } else {
            const rows = await this.opRepo
                .createQueryBuilder('op')
                .select(`HOUR(${toLocalTz('order.createdAt')})`, 'hour')
                .addSelect(
                    metric === 'profit'
                        ? `COALESCE(SUM((${profitExpr}) * op.quantity),0)`
                        : `COALESCE(SUM((${amountExpr}) * op.quantity),0)`,
                    'value'
                )
                .innerJoin('op.order', 'order')
                .innerJoin('op.product', 'product')
                .leftJoin('op.unit', 'unit')
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('hour')
                .getRawMany()

            const map = new Map<number, number>(
                rows.map((r) => [Number(r.hour), Number(r.value)])
            )

            return buckets.map((h) => ({
                label: `${h}:00`,
                value: map.get(h) ?? 0,
            }))
        }
    }

    private async buildWeekChart(
        metric: MetricType,
        start: string,
        end: string,
        profitExpr: string,
        amountExpr: string
    ): Promise<ChartItem[]> {
        // buckets: iso weekdays 1..7 (Mon..Sun)
        const buckets = [1, 2, 3, 4, 5, 6, 7]

        if (metric === 'revenue' || metric === 'orders') {
            const qb = this.orderRepo
                .createQueryBuilder('order')
                .select(
                    `DAYOFWEEK(${toLocalTz('order.createdAt')})`,
                    'mysqlDay'
                )
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('mysqlDay')

            if (metric === 'revenue') {
                qb.addSelect('COALESCE(SUM(order.total),0)', 'value')
            } else {
                qb.addSelect('COUNT(DISTINCT order.id)', 'value')
            }

            const rows = await qb.getRawMany()
            const map = new Map<number, number>()
            for (const r of rows) {
                const mysqlDay = Number(r.mysqlDay) // 1..7 (Sun..Sat)
                const isoWeekday = mysqlDay === 1 ? 7 : mysqlDay - 1 // convert to 1(Mon)..7(Sun)
                map.set(isoWeekday, Number(r.value))
            }

            const labels = [
                'Thứ 2',
                'Thứ 3',
                'Thứ 4',
                'Thứ 5',
                'Thứ 6',
                'Thứ 7',
                'Chủ Nhật',
            ]

            return buckets.map((d, idx) => ({
                label: labels[idx],
                value: map.get(d) ?? 0,
            }))
        } else {
            const rows = await this.opRepo
                .createQueryBuilder('op')
                .select(
                    `DAYOFWEEK(${toLocalTz('order.createdAt')})`,
                    'mysqlDay'
                )
                .addSelect(
                    metric === 'profit'
                        ? `COALESCE(SUM((${profitExpr}) * op.quantity),0)`
                        : `COALESCE(SUM((${amountExpr}) * op.quantity),0)`,
                    'value'
                )
                .innerJoin('op.order', 'order')
                .innerJoin('op.product', 'product')
                .leftJoin('op.unit', 'unit')
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('mysqlDay')
                .getRawMany()

            const map = new Map<number, number>()
            for (const r of rows) {
                const mysqlDay = Number(r.mysqlDay)
                const isoWeekday = mysqlDay === 1 ? 7 : mysqlDay - 1
                map.set(isoWeekday, Number(r.value))
            }

            const labels = [
                'Thứ 2',
                'Thứ 3',
                'Thứ 4',
                'Thứ 5',
                'Thứ 6',
                'Thứ 7',
                'Chủ Nhật',
            ]

            return buckets.map((d, idx) => ({
                label: labels[idx],
                value: map.get(d) ?? 0,
            }))
        }
    }

    private async buildMonthChart(
        metric: MetricType,
        start: string,
        end: string,
        profitExpr: string,
        amountExpr: string
    ): Promise<ChartItem[]> {
        // need to find how many days are in the selected month.
        // We can use the end date: convert to JS Date and get day number.
        const monthEnd = new Date(end) // end is in DB format UTC
        const ndays = monthEnd.getUTCDate() // day-of-month of monthEnd is number of days in month

        const buckets = Array.from({ length: ndays }, (_, i) => i + 1)

        if (metric === 'revenue' || metric === 'orders') {
            const qb = this.orderRepo
                .createQueryBuilder('order')
                // convert DB UTC to local +07:00 for grouping by day-of-month consistent with UI timezone
                .select(`DAY(${toLocalTz('order.createdAt')})`, 'day')
                .addSelect(
                    metric === 'revenue'
                        ? 'COALESCE(SUM(order.total),0)'
                        : 'COUNT(DISTINCT order.id)',
                    'value'
                )
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('day')

            const rows = await qb.getRawMany()

            const map = new Map<number, number>(
                rows.map((r) => [Number(r.day), Number(r.value)])
            )

            return buckets.map((d) => ({
                label: `${d}`,
                value: map.get(d) ?? 0,
            }))
        } else {
            const rows = await this.opRepo
                .createQueryBuilder('op')
                .select(`DAY(${toLocalTz('order.createdAt')})`, 'day')
                .addSelect(
                    metric === 'profit'
                        ? `COALESCE(SUM((${profitExpr}) * op.quantity),0)`
                        : `COALESCE(SUM((${amountExpr}) * op.quantity),0)`,
                    'value'
                )
                .innerJoin('op.order', 'order')
                .innerJoin('op.product', 'product')
                .leftJoin('op.unit', 'unit')
                .where('order.createdAt BETWEEN :start AND :end', {
                    start,
                    end,
                })
                .andWhere('order.deletedAt IS NULL')
                .groupBy('day')
                .getRawMany()

            const map = new Map<number, number>(
                rows.map((r) => [Number(r.day), Number(r.value)])
            )

            return buckets.map((d) => ({
                label: `${d}`,
                value: map.get(d) ?? 0,
            }))
        }
    }
}
