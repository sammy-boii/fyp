import type { DriveStep } from 'driver.js'

// ─── Dashboard Tour ──────────────────────────────────────────────────────────
export const dashboardSteps: DriveStep[] = [
  {
    element: '[data-tour="dashboard-header"]',
    popover: {
      title: 'Your Profile',
      description:
        'This is your profile section. You can see your name, email, and avatar here.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="dashboard-edit-profile"]',
    popover: {
      title: 'Edit Profile',
      description:
        'Click here to update your name and avatar. Changes are saved instantly.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Quick Stats',
      description:
        'These cards show your key metrics — total workflows, connected credentials, and account status.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="dashboard-chart"]',
    popover: {
      title: 'Activity Chart',
      description:
        'This chart visualizes your workflow execution activity over time.',
      side: 'top',
      align: 'center'
    }
  }
]

// ─── Workflows List Tour ─────────────────────────────────────────────────────
export const workflowsSteps: DriveStep[] = [
  {
    element: '[data-tour="workflows-header"]',
    popover: {
      title: 'Workflows',
      description:
        'This is your workflows hub. All your automation workflows are listed here.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="workflows-add"]',
    popover: {
      title: 'Create a Workflow',
      description:
        'Click this button to create a new workflow. Give it a name and description, then configure its steps in the editor.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="workflows-table"]',
    popover: {
      title: 'Workflow List',
      description:
        'Your workflows appear here in a table. You can see their status, last run time, and manage them with action buttons.',
      side: 'top',
      align: 'center'
    }
  }
]

// ─── Workflow Editor Tour ────────────────────────────────────────────────────
export const workflowEditorSteps: DriveStep[] = [
  {
    element: '[data-tour="editor-header"]',
    popover: {
      title: 'Workflow Header',
      description:
        'This bar shows your workflow name along with save, execute, and active/inactive controls.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="editor-back"]',
    popover: {
      title: 'Go Back',
      description: 'Click here to return to the workflows list.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="editor-edit-name"]',
    popover: {
      title: 'Edit Workflow Details',
      description:
        'Click the pencil icon to rename your workflow or update its description.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="editor-active-toggle"]',
    popover: {
      title: 'Activate / Deactivate',
      description:
        'Toggle this switch to activate or deactivate your workflow. Active workflows can be triggered by their configured triggers.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="editor-execute"]',
    popover: {
      title: 'Execute Workflow',
      description:
        'Click Execute to manually run your workflow. This is available when the workflow uses a manual trigger.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="editor-save"]',
    popover: {
      title: 'Save Workflow',
      description:
        'Save your workflow changes. Always save before leaving the editor!',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="editor-tabs"]',
    popover: {
      title: 'Editor & Executions Tabs',
      description:
        'Switch between the visual editor (to build your workflow) and the executions tab (to view run history and live logs).',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="editor-add-node"]',
    popover: {
      title: 'Add Nodes',
      description:
        'Click the + button to add new nodes to your workflow. Start with a trigger, then add action nodes like Gmail, Discord, AI, and more.',
      side: 'left',
      align: 'start'
    }
  },
  {
    element: '[data-tour="editor-canvas"]',
    popover: {
      title: 'Workflow Canvas',
      description:
        'This is your visual workflow builder. Drag nodes to reposition them. Click a node to configure it. Connect nodes by dragging from one handle to another.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="editor-ai-prompt"]',
    popover: {
      title: 'AI Workflow Generator',
      description:
        'Describe what you want your workflow to do in plain English, and AI will generate the nodes and connections for you!',
      side: 'top',
      align: 'center'
    }
  }
]

// ─── Credentials Tour ────────────────────────────────────────────────────────
export const credentialsSteps: DriveStep[] = [
  {
    element: '[data-tour="credentials-header"]',
    popover: {
      title: 'Credentials',
      description:
        'Manage your connected third-party accounts and API keys here. These are used by your workflow nodes.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="credentials-add"]',
    popover: {
      title: 'Add a Credential',
      description:
        "Click here to connect a new provider like Google, Discord, or others. You'll be guided through the OAuth flow.",
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="credentials-table"]',
    popover: {
      title: 'Your Credentials',
      description:
        'All connected credentials appear here. You can see their provider, status (active, expiring, or revoked), and manage them.',
      side: 'top',
      align: 'center'
    }
  }
]

// ─── Activity Tour ───────────────────────────────────────────────────────────
export const activitySteps: DriveStep[] = [
  {
    element: '[data-tour="activity-header"]',
    popover: {
      title: 'Activity Log',
      description:
        'This page shows all your workflow execution history across all workflows.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="activity-live-indicator"]',
    popover: {
      title: 'Live Updates',
      description:
        "This indicator shows whether you're connected for real-time execution updates via WebSocket.",
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="activity-stats"]',
    popover: {
      title: 'Execution Stats',
      description:
        'Quick overview of your total executions, success rate, and failure count.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="activity-clear"]',
    popover: {
      title: 'Clear Activity',
      description:
        'Use this button to clear all execution history. This action cannot be undone.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="activity-table"]',
    popover: {
      title: 'Execution History',
      description:
        'Each row shows a workflow execution with its status, duration, trigger type, and timestamp. Click a row to see detailed node-by-node execution info.',
      side: 'top',
      align: 'center'
    }
  }
]

// ─── Sidebar Tour (shown once on first visit) ───────────────────────────────
export const sidebarSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-logo"]',
    popover: {
      title: 'Welcome to Flux! ⚡',
      description:
        "Flux is your workflow automation platform. Let's take a quick tour to get you started!",
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="sidebar-nav"]',
    popover: {
      title: 'Navigation',
      description:
        'Use the sidebar to navigate between Dashboard, Workflows, Credentials, and Activity pages.',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar-dashboard"]',
    popover: {
      title: 'Dashboard',
      description: 'View your profile, stats, and activity charts at a glance.',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar-workflows"]',
    popover: {
      title: 'Workflows',
      description:
        'Create and manage automation workflows. This is where the magic happens!',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar-credentials"]',
    popover: {
      title: 'Credentials',
      description:
        'Connect third-party services like Gmail, Google Drive, and Discord to use in your workflows.',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar-activity"]',
    popover: {
      title: 'Activity',
      description:
        'Monitor all your workflow executions with real-time updates and detailed logs.',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar-user"]',
    popover: {
      title: 'Your Account',
      description:
        'Access your profile, toggle dark/light mode, change accent color, and log out from here.',
      side: 'right',
      align: 'end'
    }
  },
  {
    element: '[data-tour="sidebar-help"]',
    popover: {
      title: 'Need Help?',
      description:
        'You can restart this tour anytime by clicking this help button. Each page also has its own guided tour!',
      side: 'right',
      align: 'end'
    }
  }
]

// ─── Map page paths to their tour steps ──────────────────────────────────────
export type TourPage =
  | 'sidebar'
  | 'dashboard'
  | 'workflows'
  | 'workflow-editor'
  | 'credentials'
  | 'activity'

export const tourStepsByPage: Record<TourPage, DriveStep[]> = {
  sidebar: sidebarSteps,
  dashboard: dashboardSteps,
  workflows: workflowsSteps,
  'workflow-editor': workflowEditorSteps,
  credentials: credentialsSteps,
  activity: activitySteps
}

/**
 * Resolve the current page tour name from a pathname.
 */
export function resolveTourPage(pathname: string): TourPage | null {
  if (pathname.match(/^\/workflows\/[^/]+$/)) return 'workflow-editor'
  if (pathname === '/workflows') return 'workflows'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname === '/credentials') return 'credentials'
  if (pathname === '/activity') return 'activity'
  return null
}
