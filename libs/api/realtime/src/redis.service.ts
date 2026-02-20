import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private eventHandlers: Map<string, Set<(message: any) => void>> = new Map();

  async onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    this.publisher = createClient({ url });
    this.subscriber = this.publisher.duplicate();

    this.publisher.on('error', (err) => this.logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => this.logger.error('Redis Subscriber Error', err));

    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

    // Global listener for system events
    await this.subscriber.subscribe('medcore_system_events', (message) => {
      try {
        const parsed = JSON.parse(message);
        this.emit('system.event', parsed);
      } catch (e) {
        this.logger.error('Failed to parse Redis message', e);
      }
    });

    this.logger.log('Redis Service initialized');
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher.disconnect(), this.subscriber.disconnect()]);
  }

  on(event: string, callback: (message: any) => void) {
    const handlers = this.eventHandlers.get(event) ?? new Set<(message: any) => void>();
    handlers.add(callback);
    this.eventHandlers.set(event, handlers);
  }

  off(event: string, callback: (message: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(callback);

    if (handlers.size === 0) {
      this.eventHandlers.delete(event);
    }
  }

  async publish(event: string, payload: any) {
    await this.publisher.publish('medcore_system_events', JSON.stringify({ type: event, ...payload }));
  }

  private emit(event: string, message: any) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error) {
        this.logger.error(`Event handler failed for ${event}`, error);
      }
    }
  }
}
