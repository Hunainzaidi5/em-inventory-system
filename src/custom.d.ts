// Add this to help TypeScript understand the @/ path alias
declare module '@/services/inventoryService' {
  import { LowStockItem } from '@/components/dashboard/LowStockAlert';
  
  export const getLowStockItems: () => Promise<LowStockItem[]>;
  // Add other exports as needed
}

// This helps TypeScript understand the @/ path alias
declare module '@/services/*' {
  const content: any;
  export default content;
}
