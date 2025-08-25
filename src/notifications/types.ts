export interface NotificationEvent {
  type: 'task' | 'project' | 'user';
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'completed' | 'status_changed';
  data: any;
  timestamp: Date;
  userId?: string;
  projectId?: string;
  taskId?: string;
}

export interface JoinRoomData {
  room: string;
  projectId?: string;
}

export interface LeaveRoomData {
  room: string;
}

export interface TaskNotificationData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  projectId: string;
  dueDate?: Date;
  updatedBy: string;
}

export interface ProjectNotificationData {
  id: string;
  name: string;
  description?: string;
  status: string;
  ownerId: string;
  memberIds: string[];
  updatedBy: string;
}
