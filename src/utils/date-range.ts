import { DateTime } from 'luxon'
import { DEFAULT_TIMEZONE } from './constant'

export type RangeType = 'day' | 'week' | 'month'

const DB_FORMAT = 'yyyy-LL-dd HH:mm:ss' // match DB timestamp format

function formatToDb(dt: DateTime) {
    return dt.toUTC().toFormat(DB_FORMAT)
}

export function toLocalTz(s: string, tz: string = DEFAULT_TIMEZONE) {
    return `CONVERT_TZ(${s}, '+00:00', '${tz}')`
}

/**
 * Get UTC-formatted start/end for a given range and date.
 * - range: 'day' | 'week' | 'month'
 * - dateStr: optional date string (ISO or any Date-parsable string)
 * - tz: timezone to interpret the date in (default Asia/Ho_Chi_Minh)
 *
 * Returns { start, end } as strings formatted for DB (UTC).
 */
export function getRangeForFilter(
    range: RangeType,
    dateStr?: string,
    tz = DEFAULT_TIMEZONE
) {
    let base = dateStr
        ? DateTime.fromISO(dateStr, { zone: tz })
        : DateTime.now().setZone(tz)

    if (!base.isValid) {
        const asDate = new Date(dateStr ?? '')
        if (!Number.isNaN(asDate.getTime())) {
            base = DateTime.fromJSDate(asDate).setZone(tz)
        }
    }

    switch (range) {
        case 'day': {
            const start = base.startOf('day')
            const end = base.endOf('day')
            return { start: formatToDb(start), end: formatToDb(end) }
        }
        case 'week': {
            const start = base.startOf('week') // Luxon: week starts Monday
            const end = base.endOf('week')
            return { start: formatToDb(start), end: formatToDb(end) }
        }
        case 'month': {
            const start = base.startOf('month')
            const end = base.endOf('month')
            return { start: formatToDb(start), end: formatToDb(end) }
        }
        default: {
            const start = base.startOf('month')
            const end = base.endOf('month')
            return { start: formatToDb(start), end: formatToDb(end) }
        }
    }
}
