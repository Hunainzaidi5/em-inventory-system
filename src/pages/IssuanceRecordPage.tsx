import React, { useState, useEffect } from "react";

const IssuanceRecordPage = () => {
  const [issuanceData, setIssuanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/excel_data.json');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        const data = await response.json();
        setIssuanceData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Issuance Record</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Issuance Record</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!issuanceData || !issuanceData.issuance_slip) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Issuance Record</h1>
        <p>No data available</p>
      </div>
    );
  }

  const sheet = issuanceData.issuance_slip[Object.keys(issuanceData.issuance_slip)[0]];

  return (
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
};

export default IssuanceRecordPage; 