
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private eventHandlers: Map<string, (message: any) => void> = new Map();

  async onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.publisher = createClient({ url });
    this.subscriber = this.publisher.duplicate();

    this.publisher.on('error', err => this.logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', err => this.logger.error('Redis Subscriber Error', err));

    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect()
    ]);

    // Global listener for system events
    await this.subscriber.subscribe('medcore_system_events', (message) => {
      try {
        const parsed = JSON.parse(message);
        const handler = this.eventHandlers.get('system.event');
        if (handler) handler(parsed);
      } catch (e) {
        this.logger.error('Failed to parse Redis message', e);
      }
    });

    this.logger.log('Redis Service initialized');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.publisher.disconnect(),
      this.subscriber.disconnect()
    ]);
  }

  on(event: string, callback: (message: any) => void) {
    this.eventHandlers.set(event, callback);
  }

  async publish(event: string, payload: any) {
    await this.publisher.publish('medcore_system_events', JSON.stringify({ type: event, ...payload }));
  }
}
