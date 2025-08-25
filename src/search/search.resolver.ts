import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto, AutocompleteQueryDto } from './dto/search.dto';

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async search(
    @Args('query') q: string,
    @Args('type', { nullable: true }) type?: 'project' | 'task',
    @Args('status', { nullable: true }) status?: string,
    @Args('priority', { nullable: true }) priority?: string,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('offset', { nullable: true }) offset?: number
  ): Promise<string> {
    const query: SearchQueryDto = {
      q,
      type,
      status,
      priority,
      limit,
      offset
    };

    const results = await this.searchService.search(query);
    
    return JSON.stringify({
      results: results.map(result => ({
        id: result.id,
        type: result.type,
        title: result.title,
        description: result.description,
        status: result.status,
        priority: result.priority,
        score: result.score,
        highlight: result.highlight ? {
          title: result.highlight.title,
          description: result.highlight.description
        } : undefined
      })),
      total: results.length,
      elasticsearchAvailable: this.searchService.isElasticsearchAvailable()
    });
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async autocomplete(
    @Args('query') q: string,
    @Args('limit', { nullable: true }) limit?: number
  ): Promise<string> {
    const query: AutocompleteQueryDto = { q, limit };
    const suggestions = await this.searchService.autocomplete(query);
    
    return JSON.stringify({
      suggestions: suggestions.map(suggestion => ({
        text: suggestion.text,
        type: suggestion.type,
        id: suggestion.id
      })),
      elasticsearchAvailable: this.searchService.isElasticsearchAvailable()
    });
  }
}
