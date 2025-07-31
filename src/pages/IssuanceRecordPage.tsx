import React from "react";
// @ts-ignore
const issuanceData = require("../excel_data.json");

const sheet = issuanceData.issuance_slip[Object.keys(issuanceData.issuance_slip)[0]];

const IssuanceRecordPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Issuance Record</h1>
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

export default IssuanceRecordPage; 