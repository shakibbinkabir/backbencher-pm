import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AssignmentResultType {
  @Field(() => String)
  taskId!: string;

  @Field(() => String, { nullable: true })
  assigneeId!: string | null;

  @Field(() => String, { nullable: true })
  assigneeEmail?: string;

  @Field(() => String)
  reason!: string;
}
