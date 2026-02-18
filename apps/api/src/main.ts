
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './app/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // SECURITY: Enable Trust Proxy for Nginx X-Forwarded-For
  // Only trust the loopback and the internal docker network (or specific load balancer IP)
  // 'loopback, linklocal, uniquelocal' is a safe default for Docker environments
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback, linklocal, uniquelocal');

  // GLOBAL PIPES
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true 
  }));

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !corsOrigin) {
    throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
  }

  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((origin) => origin.trim()) : ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // REDIS ADAPTER FOR SOCKET.IO (SCALABILITY)
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 API running on port ${port}`);
}

bootstrap();
