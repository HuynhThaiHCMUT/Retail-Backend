import { Injectable, Scope } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'

@Injectable({ scope: Scope.DEFAULT }) // Global singleton
export class RequestContext {
    private storage = new AsyncLocalStorage<Map<string, any>>()

    run(fn: () => void, data: Record<string, any>) {
        this.storage.run(new Map(Object.entries(data)), fn)
    }

    get<T>(key: string): T | undefined {
        return this.storage.getStore()?.get(key)
    }
}
