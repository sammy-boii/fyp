# Workflow Execution System

## Overview

This is a custom-built workflow execution engine for n8n-style automation. It executes workflows defined as directed acyclic graphs (DAGs) where nodes represent actions and edges represent data flow.

## Architecture

### Core Components

1. **WorkflowExecutor** (`src/executors/base.executor.ts`)
   - Main execution engine
   - Builds dependency graph from nodes and edges
   - Uses topological sort to determine execution order
   - Executes nodes in parallel when possible (same dependency level)
   - Handles data flow between nodes

2. **NodeExecutorRegistry** (`src/executors/registry.ts`)
   - Registry pattern for node executors
   - Maps node types (GMAIL, GOOGLE_DRIVE) to their executors
   - Easy to extend with new node types

3. **Node Executors** (`src/executors/nodes/`)
   - `GmailExecutor`: Handles Gmail actions (send_email, read_email)
   - `GoogleDriveExecutor`: Handles Google Drive actions (upload_file, list_files, etc.)
   - Each executor implements the `NodeExecutor` interface

4. **WorkflowExecutionService** (`src/services/workflow-execution.service.ts`)
   - High-level service for workflow execution
   - Manages execution state in database
   - Handles execution history and tracking

### Database Schema

The Prisma schema has been updated with:

- **Workflow**: Stores workflow definition (nodes, edges, status)
- **WorkflowExecution**: Tracks each workflow run
- **NodeExecution**: Tracks individual node executions within a workflow run

### Execution Flow

1. **Workflow Definition**: Frontend sends nodes and edges (React Flow format)
2. **Dependency Graph**: Executor builds a graph to determine execution order
3. **Topological Sort**: Nodes are grouped into levels (can execute in parallel)
4. **Node Execution**: Each node executor:
   - Gets credentials for the service
   - Collects input data from previous nodes
   - Executes the action
   - Returns output data
5. **Data Flow**: Output from one node becomes input to connected nodes
6. **State Tracking**: All executions are saved to database for history/debugging

## API Endpoints

### Workflow Management
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PATCH /api/workflows/:id` - Update workflow

### Execution
- `POST /api/workflows/:id/execute` - Execute a workflow
- `GET /api/workflows/:id/executions` - Get execution history
- `GET /api/workflows/executions/:executionId` - Get execution details

## Adding New Node Types

1. Create a new executor class implementing `NodeExecutor`:
```typescript
export class MyNewExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    // Implementation
  }
}
```

2. Register it in `WorkflowExecutionService`:
```typescript
registry.register('MY_NODE_TYPE', new MyNewExecutor())
```

3. Add actions in the frontend node definitions

## Features

- ✅ DAG-based execution (handles complex workflows)
- ✅ Parallel execution (nodes at same level run concurrently)
- ✅ Data flow between nodes
- ✅ Execution history and tracking
- ✅ Error handling and recovery
- ✅ Credential management integration
- ✅ Extensible architecture

## Future Enhancements

- [ ] Token refresh for expired credentials
- [ ] Retry logic for failed nodes
- [ ] Conditional branching (if/else nodes)
- [ ] Loops and iterations
- [ ] Webhook triggers
- [ ] Scheduled workflows (cron)
- [ ] Real-time execution monitoring
- [ ] Execution queue for rate limiting

## Example Usage

```typescript
// Execute a workflow
const result = await executionService.executeWorkflow(
  workflowId,
  userId,
  { triggerData: 'some data' }
)

// Get execution history
const history = await executionService.getExecutionHistory(workflowId, userId)
```

