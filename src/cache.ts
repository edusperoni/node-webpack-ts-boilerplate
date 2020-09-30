
export interface AddOptions {
    key: string;
    promise: Promise<any>;
    /**
     * expire this amount of ms after adding
     */
    expire?: number;
    /**
     * expires this amount of ms after resolve
     */
    expireAfterResolve?: number;
    /**
     * expires when/if promise completes
     */
    expireOnComplete?: boolean;
    /**
     * expires this amount of ms after error
     */
    expireAfterError?: number;
    /**
     * expires when/if promise rejects
     * @default true
     */
    expireOnError?: boolean;
}

const defaultAddOptions: Partial<AddOptions> = {
    expireOnError: true
};

class Cache {
    private cacheStore: { [key: string]: { promise: Promise<any>, timers: NodeJS.Timer[], valid: boolean } } = {};

    public add(options: AddOptions) {
        options = {
            ...defaultAddOptions,
            ...options
        };
        const cacheValue: { promise: Promise<any>, timers: NodeJS.Timer[], valid: boolean } = { promise: options.promise, timers: [], valid: true };
        this.cacheStore[options.key] = cacheValue;

        const removeIfValid = () => {
            if (cacheValue.valid) { this.remove(options.key); }
        };
        const removeAfter = (time: number) => () => {
            if (cacheValue.valid) { cacheValue.timers.push(setTimeout(removeIfValid, time)); }
        };
        const catchMethod = options.expireOnError ? () => {
            if (cacheValue.valid) {
                this.remove(options.key);
            }
        } : (options.expireAfterError && options.expireAfterError > 0 ? removeAfter(options.expireAfterError) : undefined);
        const thenMethod = options.expireOnComplete ? removeIfValid :
            (options.expireAfterResolve && options.expireAfterResolve > 0 ? removeAfter(options.expireAfterResolve) : undefined);
        if (options.expire && options.expire > 0) {
            removeAfter(options.expire);
        }
        options.promise.then(thenMethod, catchMethod);
    }

    public remove(key: string): boolean {
        if (!this.cacheStore.hasOwnProperty(key)) {
            return false;
        }
        this.cacheStore[key].valid = false;
        this.cacheStore[key].timers.forEach((t) => clearTimeout(t));
        delete this.cacheStore[key];
        return true;
    }

    public get<T>(key: string): Promise<T> | undefined {
        if (!this.cacheStore.hasOwnProperty(key)) {
            return undefined;
        }
        return this.cacheStore[key].promise;
    }

    public clear() {
        for (const k of Object.keys(this.cacheStore)) {
            this.remove(k);
        }
    }
}

export const cache = new Cache();
