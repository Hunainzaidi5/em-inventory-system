import json
import math

# Read the original WSD file
with open('public/wsd.json', 'r', encoding='utf-8') as f:
    wsd_data = json.load(f)

# Convert to the new format
converted_data = []

for item in wsd_data:
    # Skip items with missing descriptions
    if not item.get('Item_Description'):
        continue
    
    # Check for NaN in Specification
    spec = item.get('Specification')
    if isinstance(spec, float) and math.isnan(spec):
        continue
    
    # Handle Sr_No properly
    sr_no = item.get('Sr_No', 0)
    if sr_no:
        item_code = str(int(sr_no))
    else:
        item_code = "0"
    
    converted_item = {
        "Item Code (Brand)": item_code,
        "Item Name": item.get('Item_Description', ''),
        "IMIS CODE": item.get('IMIS_Code', ''),
        "U/M": item.get('UOM', ''),
        "Stock Received from Warehouse (20-7/23)": int(item.get('Quantity', 0)),
        "In-stock": int(item.get('Quantity', 0)),
        "Location": item.get('Location', 'C&C Warehouse, Depot')
    }
    converted_data.append(converted_item)

# Write the converted data
with open('public/wsd.json', 'w', encoding='utf-8') as f:
    json.dump(converted_data, f, indent=2, ensure_ascii=False)

print(f"Converted {len(converted_data)} items from WSD file") 