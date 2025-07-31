import openpyxl
import json
import os

files = [
    (r"Gate Pass & Issuance/Gate Pass.xlsx", "gate_pass"),
    (r"Gate Pass & Issuance/Issuance Slip.xlsx", "issuance_slip"),
]

def sheet_to_dict(ws):
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h) if h is not None else f"col{i}" for i, h in enumerate(rows[0])]
    data = [dict(zip(headers, row)) for row in rows[1:]]
    return data

result = {}
for file_path, key in files:
    if not os.path.exists(file_path):
        result[key] = f"File not found: {file_path}"
        continue
    wb = openpyxl.load_workbook(file_path)
    file_data = {}
    for ws in wb.worksheets:
        file_data[ws.title] = sheet_to_dict(ws)
    result[key] = file_data

print(json.dumps(result, indent=2, ensure_ascii=False)) 