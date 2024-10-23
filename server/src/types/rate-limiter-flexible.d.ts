// server/src/types/rate-limiter-flexible.d.ts

declare module 'rate-limiter-flexible' {
    export interface RateLimiterOptions {
        points: number; // Number of points
        duration: number; // Per second(s)
        blockDuration?: number; // Block for seconds if consumed more than points
        keyPrefix?: string;
        inmemoryBlockOnConsumed?: number;
        inmemoryBlockDuration?: number;
        execEvenly?: boolean;
        storeClient?: object; // Replace 'object' with a specific type if known
        insuranceLimiter?: object; // Replace 'object' with a specific type if applicable
        // Add other relevant options as needed
    }

    export class RateLimiterMemory {
        constructor(options: RateLimiterOptions);
        consume(key: string, points?: number): Promise<void>;
        get(
            key: string
        ): Promise<{ remainingPoints: number; msBeforeNext: number } | null>;
        // Add other methods as needed
    }

    export class RateLimiterRedis {
        constructor(options: RateLimiterOptions & { storeClient: object }); // Replace 'object' with specific type if known
        consume(key: string, points?: number): Promise<void>;
        get(
            key: string
        ): Promise<{ remainingPoints: number; msBeforeNext: number } | null>;
        // Add other methods as needed
    }

    // Add declarations for other classes like RateLimiterMongo if used
}
