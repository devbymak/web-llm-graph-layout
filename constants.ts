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
]

export const DEFAULT_SAMPLE_ID = 'state-machine'
