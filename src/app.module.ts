import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule, Resolver, Query } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';

@Resolver()
class AppResolver {
  @Query(() => String)
  hello() {
    return 'Hello from GraphQL!';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60,
        limit: Number(process.env.THROTTLE_LIMIT) || 120
      }
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isTest = cfg.get<string>('NODE_ENV') === 'test';
        if (isTest) {
          return {
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities: [User],
            synchronize: true
          };
        }
        const url = cfg.get<string>('DATABASE_URL') || 'postgres://postgres:postgres@localhost:5432/pm';
        return {
          type: 'postgres',
          url,
          entities: [User],
          synchronize: true // NOTE: enable migrations later; okay for Phase 1
        };
      }
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      path: '/graphql'
    }),
    HealthModule,
    UsersModule,
    AuthModule
  ],
  providers: [AppResolver]
})
export class AppModule {}
