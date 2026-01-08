// src/Pages/Report/report.tsx
import { useState, useMemo } from "react";
import DashboardLayout from "../../Layout/DashboardLayout";
import { FiDownload, FiSearch, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { CSVLink } from "react-csv";

interface BaseContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Campaign {
  id: number;
  name: string;
  message: string;
  recipients: BaseContact[];
  cost: number;
  date: string;
  status: "Pending" | "Sent" | "Failed";
}

type SortConfig = {
  key: keyof Campaign;
  direction: "ascending" | "descending";
};

export default function ReportPage() {
  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: "Campaign 1",
      message: "Hello there!",
      recipients: [{ id: 1, name: "John Doe", phone: "123456789" }],
      cost: 1,
      date: "2025-12-17",
      status: "Sent",
    },
    {
      id: 2,
      name: "Campaign 2",
      message: "Hi again!",
      recipients: [{ id: 2, name: "Jane Doe", phone: "987654321" }],
      cost: 1,
      date: "2025-12-17",
      status: "Pending",
    },
  ]);

  const [filter, setFilter] = useState<"All" | "Sent" | "Pending" | "Failed">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Filter + Search
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesStatus = filter === "All" || c.status === filter;
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, filter, searchTerm]);

  // Sorting
  const sortedCampaigns = useMemo(() => {
    if (!sortConfig) return filteredCampaigns;
    return [...filteredCampaigns].sort((a, b) => {
      const aKey = a[sortConfig.key];
      const bKey = b[sortConfig.key];

      if (aKey < bKey) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aKey > bKey) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredCampaigns, sortConfig]);

  const requestSort = (key: keyof Campaign) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const totalCampaigns = filteredCampaigns.length;
  const totalRecipients = filteredCampaigns.reduce((acc, c) => acc + c.recipients.length, 0);
  const totalCost = filteredCampaigns.reduce((acc, c) => acc + c.cost, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Top Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-100 p-4 rounded-2xl text-center">
            <h2 className="text-gray-600 font-medium">Total Campaigns</h2>
            <p className="text-2xl font-bold">{totalCampaigns}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-2xl text-center">
            <h2 className="text-gray-600 font-medium">Total Recipients</h2>
            <p className="text-2xl font-bold">{totalRecipients}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-2xl text-center">
            <h2 className="text-gray-600 font-medium">Total Cost</h2>
            <p className="text-2xl font-bold">{totalCost}</p>
          </div>
        </section>

        {/* Filters + Search + CSV */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Filter by status:</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as "All" | "Sent" | "Pending" | "Failed")}
              className="border rounded px-3 py-2"
            >
              <option value="All">All Statuses</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border rounded px-3 py-2">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="outline-none w-full"
            />
          </div>

          <CSVLink
            data={sortedCampaigns}
            filename="campaign_report.csv"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
          >
            <FiDownload /> Export CSV
          </CSVLink>
        </section>

        {/* Campaign Table */}
        <section className="bg-white rounded-2xl shadow-lg p-6 overflow-auto">
          {sortedCampaigns.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["name", "recipients", "cost", "date", "status"].map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 border-b cursor-pointer select-none"
                      onClick={() => requestSort(key as keyof Campaign)}
                    >
                      <div className="flex items-center gap-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        {sortConfig?.key === key && (
                          sortConfig.direction === "ascending" ? <FiArrowUp /> : <FiArrowDown />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map(c => (
                  <tr key={c.id} className="border-b hover:bg-indigo-50 transition">
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.recipients.length}</td>
                    <td className="px-4 py-2">{c.cost}</td>
                    <td className="px-4 py-2">{c.date}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.status === "Sent"
                            ? "bg-green-100 text-green-800"
                            : c.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 mt-4">No campaigns found.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
