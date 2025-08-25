import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './notifications/redis-io.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  app.use(helmet());
  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable WebSocket adapter with Redis
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Backbencher PM API')
    .setDescription('REST + GraphQL (see /graphql) for project management with real-time features.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port} | Swagger: /docs | GraphQL: /graphql`);
  console.log(`WebSocket server running on ws://localhost:${port}`);
  console.log(`WebSocket test client: http://localhost:${port}/websocket-test.html`);
}
bootstrap();
