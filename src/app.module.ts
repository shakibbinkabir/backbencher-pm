import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GraphQLModule, Resolver, Query } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HealthModule } from './health/health.module';
import { APP_GUARD } from '@nestjs/core';

@Resolver()
class AppResolver {
  @Query(() => String, { name: 'hello' })
  hello() {
    return 'ok';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: Number(process.env.THROTTLE_TTL) || 60, limit: Number(process.env.THROTTLE_LIMIT) || 120 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      path: '/graphql'
    }),
    HealthModule
  ],
  providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  AppResolver
  ]
})
export class AppModule {}
