// Stock threshold configuration
export const stockThresholds = {
  // Critical: Below 20% of min stock or below 5 items (whichever is higher)
  CRITICAL: {
    percentage: 0.2,
    minItems: 5,
    color: 'destructive',
    label: 'Critical'
  },
  // Warning: Below 50% of min stock or below 15 items (whichever is higher)
  WARNING: {
    percentage: 0.5,
    minItems: 15,
    color: 'default',
    label: 'Warning'
  },
  // Low: Below min stock but above warning threshold
  LOW: {
    color: 'secondary',
    label: 'Low'
  }
} as const;

// Default minimum stock levels per category
export const defaultMinStockLevels = {
  'Elevator': 5,
  'PPE': 15,
  'HVAC': 20,
  'FAS': 10,
  'LV': 100,
  'ELV': 8,
  'Plumbing': 25,
  'Tools': 10
} as const;

export type Category = keyof typeof defaultMinStockLevels;
