export const searchMappings = {
  projects: {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { 
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' },
            completion: {
              type: 'completion',
              analyzer: 'simple',
              search_analyzer: 'simple'
            }
          }
        },
        description: { 
          type: 'text',
          analyzer: 'standard'
        },
        status: { type: 'keyword' },
        priority: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        userId: { type: 'keyword' }
      }
    }
  },
  tasks: {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { 
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' },
            completion: {
              type: 'completion',
              analyzer: 'simple',
              search_analyzer: 'simple'
            }
          }
        },
        description: { 
          type: 'text',
          analyzer: 'standard'
        },
        status: { type: 'keyword' },
        priority: { type: 'keyword' },
        projectId: { type: 'keyword' },
        assignedUserId: { type: 'keyword' },
        dueDate: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    }
  }
};
