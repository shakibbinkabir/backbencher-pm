import { Injectable } from '@nestjs/common';
import { NotificationEvent } from './types';

@Injectable()
export class NotificationsService {
  private gateway: any;

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async emitToUser(userId: string, event: NotificationEvent) {
    if (!this.gateway) {
      console.warn('WebSocket gateway not initialized');
      return;
    }
    
    this.gateway.server.to(`user_${userId}`).emit('notification', event);
  }

  async emitToProject(projectId: string, event: NotificationEvent) {
    if (!this.gateway) {
      console.warn('WebSocket gateway not initialized');
      return;
    }
    
    this.gateway.server.to(`project_${projectId}`).emit('notification', event);
  }

  async emitToTask(taskId: string, event: NotificationEvent) {
    if (!this.gateway) {
      console.warn('WebSocket gateway not initialized');
      return;
    }
    
    this.gateway.server.to(`task_${taskId}`).emit('notification', event);
  }

  async broadcastToAll(event: NotificationEvent) {
    if (!this.gateway) {
      console.warn('WebSocket gateway not initialized');
      return;
    }
    
    this.gateway.server.emit('notification', event);
  }

  // Helper methods for common notification types
  async notifyTaskCreated(taskData: any, projectId: string) {
    const event: NotificationEvent = {
      type: 'task',
      action: 'created',
      data: taskData,
      timestamp: new Date(),
      taskId: taskData.id,
      projectId,
    };

    await this.emitToProject(projectId, event);
    if (taskData.assigneeId) {
      await this.emitToUser(taskData.assigneeId, event);
    }
  }

  async notifyTaskUpdated(taskData: any, projectId: string) {
    const event: NotificationEvent = {
      type: 'task',
      action: 'updated',
      data: taskData,
      timestamp: new Date(),
      taskId: taskData.id,
      projectId,
    };

    await this.emitToProject(projectId, event);
    await this.emitToTask(taskData.id, event);
    if (taskData.assigneeId) {
      await this.emitToUser(taskData.assigneeId, event);
    }
  }

  async notifyTaskDeleted(taskId: string, projectId: string, taskData?: any) {
    const event: NotificationEvent = {
      type: 'task',
      action: 'deleted',
      data: taskData || { id: taskId },
      timestamp: new Date(),
      taskId,
      projectId,
    };

    await this.emitToProject(projectId, event);
    await this.emitToTask(taskId, event);
  }

  async notifyTaskStatusChanged(taskData: any, projectId: string) {
    const event: NotificationEvent = {
      type: 'task',
      action: 'status_changed',
      data: taskData,
      timestamp: new Date(),
      taskId: taskData.id,
      projectId,
    };

    await this.emitToProject(projectId, event);
    await this.emitToTask(taskData.id, event);
    if (taskData.assigneeId) {
      await this.emitToUser(taskData.assigneeId, event);
    }
  }

  async notifyProjectUpdated(projectData: any) {
    const event: NotificationEvent = {
      type: 'project',
      action: 'updated',
      data: projectData,
      timestamp: new Date(),
      projectId: projectData.id,
    };

    await this.emitToProject(projectData.id, event);
    
    // Notify all project members
    if (projectData.memberIds && Array.isArray(projectData.memberIds)) {
      for (const memberId of projectData.memberIds) {
        await this.emitToUser(memberId, event);
      }
    }
  }
}
