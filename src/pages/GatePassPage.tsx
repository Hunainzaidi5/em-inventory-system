import React from "react";
// @ts-ignore
const excelData = require("../excel_data.json");

const sheet = excelData.gate_pass[Object.keys(excelData.gate_pass)[0]];

const GatePassPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Gate Pass Generator</h1>
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            {sheet.length > 0 && Object.keys(sheet[0]).map((key: string) => (
              <th key={key} className="border px-2 py-1 bg-gray-100">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.map((row: any, i: number) => (
            <tr key={i}>
              {Object.values(row).map((val: any, j: number) => (
                <td key={j} className="border px-2 py-1">{val !== null ? val : ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default GatePassPage; 