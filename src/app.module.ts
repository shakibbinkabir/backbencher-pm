import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { Project } from './tasks/project.entity';
import { Task } from './tasks/task.entity';
import { TasksModule } from './tasks/tasks.module';

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
        const entities = [User, Project, Task];
        if (isTest) {
          return {
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities,
            synchronize: true,
            // SQLite specific configuration
            extra: {
              // This helps with date handling in SQLite
              timezone: 'utc'
            }
          };
        }
        const url = cfg.get<string>('DATABASE_URL') || 'postgres://postgres:postgres@localhost:5432/pm';
        return {
          type: 'postgres',
          url,
          entities,
          synchronize: true // NOTE: enable migrations later; acceptable for Phase 2
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
    AuthModule,
    TasksModule
  ]
})
export class AppModule {}
