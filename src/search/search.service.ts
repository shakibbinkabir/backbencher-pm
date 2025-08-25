import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { searchMappings } from './mappings';
import { SearchQueryDto, AutocompleteQueryDto } from './dto/search.dto';

export interface SearchResult {
  id: string;
  type: 'project' | 'task';
  title: string;
  description?: string;
  status: string;
  priority: string;
  score: number;
  highlight?: {
    title?: string[];
    description?: string[];
  };
}

export interface AutocompleteResult {
  text: string;
  type: 'project' | 'task';
  id: string;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Client;
  private isAvailable = false;

  constructor(private configService: ConfigService) {
    const elasticsearchUrl = this.configService.get<string>('ELASTICSEARCH_URL') || 'http://localhost:9200';
    this.client = new Client({ node: elasticsearchUrl });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.isAvailable = true;
      await this.initializeIndices();
      this.logger.log('Elasticsearch connection established and indices initialized');
    } catch (error: any) {
      this.logger.warn(`Elasticsearch not available: ${error.message}. Search functionality will be disabled.`);
      this.isAvailable = false;
    }
  }

  private async initializeIndices(): Promise<void> {
    try {
      // Create projects index
      const projectsExists = await this.client.indices.exists({ index: 'projects' });
      if (!projectsExists) {
        await this.client.indices.create({
          index: 'projects',
          ...searchMappings.projects as any
        });
        this.logger.log('Projects index created');
      }

      // Create tasks index
      const tasksExists = await this.client.indices.exists({ index: 'tasks' });
      if (!tasksExists) {
        await this.client.indices.create({
          index: 'tasks',
          ...searchMappings.tasks as any
        });
        this.logger.log('Tasks index created');
      }
    } catch (error: any) {
      this.logger.error(`Error initializing indices: ${error.message}`);
      throw error;
    }
  }

  async indexProject(project: any): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.index({
        index: 'projects',
        id: project.id.toString(),
        document: {
          id: project.id.toString(),
          title: project.title,
          description: project.description,
          status: project.status,
          priority: project.priority,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          userId: project.userId?.toString()
        }
      });

      await this.client.indices.refresh({ index: 'projects' });
    } catch (error: any) {
      this.logger.error(`Error indexing project ${project.id}: ${error.message}`);
    }
  }

  async indexTask(task: any): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.index({
        index: 'tasks',
        id: task.id.toString(),
        document: {
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId?.toString(),
          assignedUserId: task.assignedUserId?.toString(),
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        }
      });

      await this.client.indices.refresh({ index: 'tasks' });
    } catch (error: any) {
      this.logger.error(`Error indexing task ${task.id}: ${error.message}`);
    }
  }

  async removeProject(projectId: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.delete({
        index: 'projects',
        id: projectId
      });
    } catch (error: any) {
      if (error.statusCode !== 404) {
        this.logger.error(`Error removing project ${projectId}: ${error.message}`);
      }
    }
  }

  async removeTask(taskId: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.delete({
        index: 'tasks',
        id: taskId
      });
    } catch (error: any) {
      if (error.statusCode !== 404) {
        this.logger.error(`Error removing task ${taskId}: ${error.message}`);
      }
    }
  }

  async search(query: SearchQueryDto): Promise<SearchResult[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const searchBody: any = {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: query.q,
                  fields: ['title^2', 'description'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ]
          }
        },
        highlight: {
          fields: {
            title: {},
            description: {}
          }
        },
        size: query.limit || 10,
        from: query.offset || 0
      };

      // Add filters
      const filters: any[] = [];
      if (query.type) {
        // Type filter will be applied to index selection
      }
      if (query.status) {
        filters.push({ term: { status: query.status } });
      }
      if (query.priority) {
        filters.push({ term: { priority: query.priority } });
      }

      if (filters.length > 0) {
        searchBody.query.bool.filter = filters;
      }

      // Determine which indices to search
      let indices = ['projects', 'tasks'];
      if (query.type === 'project') {
        indices = ['projects'];
      } else if (query.type === 'task') {
        indices = ['tasks'];
      }

      const response = await this.client.search({
        index: indices,
        ...searchBody as any
      });

      return response.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        type: hit._index === 'projects' ? 'project' : 'task',
        title: hit._source.title,
        description: hit._source.description,
        status: hit._source.status,
        priority: hit._source.priority,
        score: hit._score,
        highlight: hit.highlight
      }));
    } catch (error: any) {
      this.logger.error(`Search error: ${error.message}`);
      return [];
    }
  }

  async autocomplete(query: AutocompleteQueryDto): Promise<AutocompleteResult[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const response = await this.client.search({
        index: ['projects', 'tasks'],
        suggest: {
          title_suggest: {
            prefix: query.q,
            completion: {
              field: 'title.completion',
              size: query.limit || 5
            }
          }
        },
        _source: ['id', 'title']
      });

      const suggestions: AutocompleteResult[] = [];
      
      if (response.suggest?.title_suggest?.[0]?.options) {
        const options = response.suggest.title_suggest[0].options as any[];
        options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            type: option._index === 'projects' ? 'project' : 'task',
            id: option._source.id
          });
        });
      }

      return suggestions;
    } catch (error: any) {
      this.logger.error(`Autocomplete error: ${error.message}`);
      return [];
    }
  }

  isElasticsearchAvailable(): boolean {
    return this.isAvailable;
  }
}
