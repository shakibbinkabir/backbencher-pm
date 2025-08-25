import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService, SearchResult, AutocompleteResult } from './search.service';
import { SearchQueryDto, AutocompleteQueryDto } from './dto/search.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  @ApiOperation({ summary: 'Search projects and tasks' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results returned successfully',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['project', 'task'] },
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              priority: { type: 'string' },
              score: { type: 'number' },
              highlight: {
                type: 'object',
                properties: {
                  title: { type: 'array', items: { type: 'string' } },
                  description: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        total: { type: 'number' },
        elasticsearchAvailable: { type: 'boolean' }
      }
    }
  })
  async search(@Query() query: SearchQueryDto): Promise<{
    results: SearchResult[];
    total: number;
    elasticsearchAvailable: boolean;
  }> {
    const results = await this.searchService.search(query);
    
    return {
      results,
      total: results.length,
      elasticsearchAvailable: this.searchService.isElasticsearchAvailable()
    };
  }

  @Get('autocomplete')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Autocomplete suggestions returned successfully',
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string', enum: ['project', 'task'] },
              id: { type: 'string' }
            }
          }
        },
        elasticsearchAvailable: { type: 'boolean' }
      }
    }
  })
  async autocomplete(@Query() query: AutocompleteQueryDto): Promise<{
    suggestions: AutocompleteResult[];
    elasticsearchAvailable: boolean;
  }> {
    const suggestions = await this.searchService.autocomplete(query);
    
    return {
      suggestions,
      elasticsearchAvailable: this.searchService.isElasticsearchAvailable()
    };
  }
}
