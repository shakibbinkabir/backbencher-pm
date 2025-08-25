import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchResolver } from './search.resolver';

@Module({
  imports: [ConfigModule],
  providers: [SearchService, SearchResolver],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
