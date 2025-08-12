import { supabase } from '@/lib/supabase';

export type RequisitionType = 'issue' | 'return' | 'consume';
export type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return' | 'general_tools' | 'spare_management';

function computeDelta(type: RequisitionType, quantity: number): number {
  if (type === 'issue' || type === 'consume') return -Math.abs(quantity);
  if (type === 'return') return Math.abs(quantity);
  return 0;
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

// LocalStorage helpers for legacy modules
function adjustLocalStorageQuantity(storageKey: string, itemName: string, delta: number) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    const idx = items.findIndex((it: any) =>
      typeof it?.itemName === 'string' && it.itemName.toLowerCase() === itemName.toLowerCase()
    );
    if (idx === -1) return;

    const currentQty = Number(items[idx].quantity) || 0;
    const newQty = clampQuantity(currentQty + delta);
    items[idx] = {
      ...items[idx],
      quantity: newQty,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(storageKey, JSON.stringify(items));

    // Broadcast a lightweight custom event so open pages can optionally listen
    window.dispatchEvent(new CustomEvent('inventory-sync', { detail: { storageKey, itemName, quantity: newQty } }));
  } catch (e) {
    console.error(`[QuantityService] Failed to adjust localStorage for ${storageKey}:`, e);
  }
}

export async function adjustQuantityForRequisition(params: {
  itemType: ItemType;
  itemName: string;
  requisitionType: RequisitionType;
  quantity: number;
}): Promise<void> {
  const { itemType, itemName, requisitionType, quantity } = params;
  const delta = computeDelta(requisitionType, quantity);
  if (!itemName || !Number.isFinite(delta) || delta === 0) return;

  if (itemType === 'spare_management') {
    // Update Supabase spare_parts
    const { data: rows, error: fetchError } = await supabase
      .from('spare_parts')
      .select('id, quantity')
      .ilike('name', itemName)
      .limit(1);

    if (fetchError) {
      console.error('[QuantityService] Fetch spare_part failed:', fetchError.message);
      return;
    }
    if (!rows || rows.length === 0) {
      console.warn(`[QuantityService] spare_part not found by name: ${itemName}`);
      return;
    }

    const row = rows[0];
    const currentQty = Number(row.quantity) || 0;
    const newQty = clampQuantity(currentQty + delta);

    const { error: updateError } = await supabase
      .from('spare_parts')
      .update({ quantity: newQty, lastUpdated: new Date().toISOString() })
      .eq('id', row.id);

    if (updateError) {
      console.error('[QuantityService] Update spare_part failed:', updateError.message);
    }
    return;
  }

  // Legacy modules backed by localStorage
  switch (itemType) {
    case 'inventory':
      adjustLocalStorageQuantity('inventoryItems', itemName, delta);
      break;
    case 'tool':
      adjustLocalStorageQuantity('toolsItems', itemName, delta);
      break;
    case 'general_tools':
      adjustLocalStorageQuantity('generalToolsItems', itemName, delta);
      break;
    case 'ppe':
      adjustLocalStorageQuantity('ppeItems', itemName, delta);
      break;
    case 'stationery':
      adjustLocalStorageQuantity('stationeryItems', itemName, delta);
      break;
    case 'faulty_return':
      // If needed, could map returns into faultyReturns list. For now, adjust quantity if exists by name
      adjustLocalStorageQuantity('faultyReturns', itemName, delta);
      break;
    default:
      console.warn('[QuantityService] Unknown item type for adjustment:', itemType);
  }
} 