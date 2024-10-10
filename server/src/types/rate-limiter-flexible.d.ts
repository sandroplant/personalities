// src/types/rate-limiter-flexible.d.ts
declare module 'rate-limiter-flexible' {
  export class RateLimiterMemory {
    constructor(options: any);
    consume(key: string): Promise<void>;
  }
}
