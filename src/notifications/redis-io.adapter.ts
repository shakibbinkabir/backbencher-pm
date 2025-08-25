import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplication } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: any;

  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    const pubClient = new Redis(redisUrl);
    const subClient = new Redis(redisUrl);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'],
        credentials: true,
      },
    });

    server.adapter(this.adapterConstructor);
    return server;
  }
}
