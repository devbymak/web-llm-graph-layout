import { Sample } from './types'

export const SAMPLES: Sample[] = [
  {
    id: 'state-machine',
    name: 'State Machine',
    description: 'Application state transitions',
    data: {
      nodes: [
        { id: "idle", type: "state", label: "Idle" },
        { id: "loading", type: "state", label: "Loading" },
        { id: "success", type: "state", label: "Success" },
        { id: "error", type: "state", label: "Error" },
        { id: "retry", type: "state", label: "Retry" },
      ],
      edges: [
        { source: "idle", target: "loading", type: "FETCH" },
        { source: "loading", target: "success", type: "RESOLVE" },
        { source: "loading", target: "error", type: "REJECT" },
        { source: "error", target: "retry", type: "RETRY" },
        { source: "retry", target: "loading", type: "FETCH" },
        { source: "success", target: "idle", type: "RESET" },
        { source: "error", target: "idle", type: "RESET" },
      ],
    },
    template: '',
  },
  {
    id: 'component-tree',
    name: 'Component Tree',
    description: 'React component hierarchy',
    data: {
      nodes: [
        { id: "app", type: "component", label: "App" },
        { id: "header", type: "component", label: "Header" },
        { id: "sidebar", type: "component", label: "Sidebar" },
        { id: "main", type: "component", label: "Main" },
        { id: "nav", type: "component", label: "Nav" },
        { id: "menu", type: "component", label: "Menu" },
        { id: "content", type: "component", label: "Content" },
        { id: "footer", type: "component", label: "Footer" },
      ],
      edges: [
        { source: "app", target: "header", type: "renders" },
        { source: "app", target: "sidebar", type: "renders" },
        { source: "app", target: "main", type: "renders" },
        { source: "app", target: "footer", type: "renders" },
        { source: "header", target: "nav", type: "renders" },
        { source: "sidebar", target: "menu", type: "renders" },
        { source: "main", target: "content", type: "renders" },
      ],
    },
    template: '',
  },
]

export const DEFAULT_SAMPLE_ID = 'state-machine'
