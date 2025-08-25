import { Resolver, Query, Args, ObjectType, Field } from '@nestjs/graphql';
import { ReportsService } from './reports.service';

@ObjectType()
class CountItem {
  @Field() key!: string;
  @Field() count!: number;
}

@ObjectType()
class ProjectSummary {
  @Field() projectId!: string;
  @Field() total!: number;
  @Field(() => [CountItem]) byStatus!: CountItem[];
  @Field(() => [CountItem]) byPriority!: CountItem[];
  @Field() overdue!: number;
}

@ObjectType()
class BurnupPoint {
  @Field() date!: string;
  @Field() total!: number;
  @Field() done!: number;
}

@ObjectType()
class BurnupSeries {
  @Field() projectId!: string;
  @Field() start!: string;
  @Field() end!: string;
  @Field(() => [BurnupPoint]) points!: BurnupPoint[];
}

@ObjectType()
class ThroughputPoint {
  @Field() date!: string;
  @Field() completed!: number;
}

@ObjectType()
class ThroughputSeries {
  @Field({ nullable: true }) projectId?: string | null;
  @Field(() => [ThroughputPoint]) points!: ThroughputPoint[];
}

@Resolver()
export class ReportsResolver {
  constructor(private readonly reports: ReportsService) {}

  @Query(() => ProjectSummary)
  async projectSummary(@Args('projectId') projectId: string) {
    return this.reports.projectSummary(projectId);
  }

  @Query(() => BurnupSeries)
  async projectBurnup(@Args('projectId') projectId: string, @Args('days', { type: () => Number, nullable: true }) days = 30) {
    return this.reports.projectBurnup(projectId, Math.max(1, Math.min(days, 120)));
  }

  @Query(() => ThroughputSeries)
  async throughput(
    @Args('days', { type: () => Number, nullable: true }) days = 30,
    @Args('projectId', { type: () => String, nullable: true }) projectId?: string
  ) {
    return this.reports.throughput(Math.max(1, Math.min(days, 120)), projectId);
  }
}
