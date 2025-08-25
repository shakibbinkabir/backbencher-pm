import { registerEnumType } from '@nestjs/graphql';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

registerEnumType(TaskStatus, { name: 'TaskStatus' });
registerEnumType(TaskPriority, { name: 'TaskPriority' });
