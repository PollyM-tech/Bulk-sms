import { useState } from "react";
import DashboardLayout from "../Layout/DashboardLayout";

interface RecipientLog {
  recipient: string;
  status: "Queued" | "Sent" | "Delivered" | "Failed";
  sentAt: string;
  deliveredAt?: string;
  cost: number;
}

interface MessageReport {
  id: string;
  message: string;
  totalRecipients: number;
  logs: RecipientLog[];
}

const mockReports: MessageReport[] = [
  {
    id: "msg1",
    message: "Hello! Your OTP is 123456",
    totalRecipients: 3,
    logs: [
      { recipient: "254712345678", status: "Delivered", sentAt: "2025-12-14 14:00", deliveredAt: "2025-12-14 14:01", cost: 1 },
      { recipient: "254798765432", status: "Failed", sentAt: "2025-12-14 14:01", cost: 1 },
      { recipient: "254701234567", status: "Delivered", sentAt: "2025-12-14 14:02", deliveredAt: "2025-12-14 14:03", cost: 1 },
    ],
  },
  {
    id: "msg2",
    message: "Promo: 50% off today only!",
    totalRecipients: 2,
    logs: [
      { recipient: "254712345678", status: "Sent", sentAt: "2025-12-14 15:00", cost: 1 },
      { recipient: "254701234567", status: "Queued", sentAt: "2025-12-14 15:01", cost: 1 },
    ],
  },
];

export default function DeliveryReportsPage() {
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null);

  const calculateDeliveryPercentage = (logs: RecipientLog[]) => {
    if (!logs.length) return 0;
    const delivered = logs.filter(l => l.status === "Delivered").length;
    return Math.round((delivered / logs.length) * 100);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold mb-6">Delivery Reports</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="xl:col-span-1 bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Messages</h2>
          <ul className="space-y-2">
            {mockReports.map(report => (
              <li
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`cursor-pointer p-2 rounded hover:bg-gray-50 ${
                  selectedReport?.id === report.id ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                }`}
              >
                <p className="text-sm font-medium truncate">{report.message}</p>
                <p className="text-xs text-gray-500">
                  Delivery: {calculateDeliveryPercentage(report.logs)}%
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Logs Panel */}
        <div className="xl:col-span-2 bg-white border rounded-xl p-4">
          {selectedReport ? (
            <>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
                Logs for: "{selectedReport.message}"
              </h2>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1">Recipient</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Sent At</th>
                    <th className="px-2 py-1">Delivered At</th>
                    <th className="px-2 py-1">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.logs.map((log, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-2 py-1">{log.recipient}</td>
                      <td className={`px-2 py-1 font-medium ${
                        log.status === "Delivered" ? "text-green-600" :
                        log.status === "Failed" ? "text-red-600" :
                        log.status === "Queued" ? "text-gray-500" :
                        "text-blue-600"
                      }`}>
                        {log.status}
                      </td>
                      <td className="px-2 py-1">{log.sentAt}</td>
                      <td className="px-2 py-1">{log.deliveredAt || "-"}</td>
                      <td className="px-2 py-1">{log.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-10 text-center">
              Select a message to view detailed delivery logs.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
