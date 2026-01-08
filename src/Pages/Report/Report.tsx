// src/Pages/Report/report.tsx
import { useState, useMemo } from "react";
import DashboardLayout from "../../Layout/DashboardLayout";
import { FiDownload, FiSearch, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { CSVLink } from "react-csv";

/* ======================
   Types
====================== */

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

type SortKey = "name" | "recipientsCount" | "cost" | "date" | "status";

type SortConfig = {
  key: SortKey;
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

  const [filter, setFilter] =
    useState<"All" | "Sent" | "Pending" | "Failed">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  /* ======================
     Filter + Search
  ====================== */
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesStatus = filter === "All" || c.status === filter;
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, filter, searchTerm]);

  /* ======================
     Normalize for Sorting & CSV
  ====================== */
  const normalizedCampaigns = useMemo(() => {
    return filteredCampaigns.map(c => ({
      ...c,
      recipientsCount: c.recipients.length,
    }));
  }, [filteredCampaigns]);

  /* ======================
     Sorting
  ====================== */
  const sortedCampaigns = useMemo(() => {
    if (!sortConfig) return normalizedCampaigns;

    return [...normalizedCampaigns].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [normalizedCampaigns, sortConfig]);

  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction:
        prev?.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  /* ======================
     Stats
  ====================== */
  const totalCampaigns = filteredCampaigns.length;
  const totalRecipients = filteredCampaigns.reduce(
    (acc, c) => acc + c.recipients.length,
    0
  );
  const totalCost = filteredCampaigns.reduce((acc, c) => acc + c.cost, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ======================
           Top Stats
        ====================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Campaigns" value={totalCampaigns} color="indigo" />
          <StatCard title="Total Recipients" value={totalRecipients} color="yellow" />
          <StatCard title="Total Cost" value={totalCost} color="green" />
        </section>

        {/* ======================
           Filters / Search / Export
        ====================== */}
        <section className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filter}
              onChange={e =>
                setFilter(e.target.value as "All" | "Sent" | "Pending" | "Failed")
              }
              className="border rounded-lg px-3 py-2"
            >
              <option value="All">All Statuses</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 w-full sm:w-64">
              <FiSearch className="text-gray-500" />
              <input
                className="outline-none w-full"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <CSVLink
            data={sortedCampaigns}
            filename="campaign_report.csv"
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
          >
            <FiDownload /> Export CSV
          </CSVLink>
        </section>

        {/* ======================
           Desktop Table
        ====================== */}
        <section className="hidden md:block bg-white rounded-2xl shadow p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "name", label: "Name" },
                  { key: "recipientsCount", label: "Recipients" },
                  { key: "cost", label: "Cost" },
                  { key: "date", label: "Date" },
                  { key: "status", label: "Status" },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key as SortKey)}
                    className="px-4 py-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig?.key === col.key &&
                        (sortConfig.direction === "ascending" ? (
                          <FiArrowUp />
                        ) : (
                          <FiArrowDown />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map(c => (
                <tr key={c.id} className="border-b hover:bg-indigo-50">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.recipientsCount}</td>
                  <td className="px-4 py-2">{c.cost}</td>
                  <td className="px-4 py-2">{c.date}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ======================
           Mobile Cards
        ====================== */}
        <section className="md:hidden space-y-4">
          {sortedCampaigns.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow p-4 space-y-2">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-gray-600">
                Recipients: {c.recipientsCount}
              </div>
              <div className="text-sm">Cost: {c.cost}</div>
              <div className="text-sm">Date: {c.date}</div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ======================
   Reusable Components
====================== */

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "indigo" | "yellow" | "green";
}) {
  return (
    <div className={`bg-${color}-100 p-4 rounded-2xl text-center`}>
      <h2 className="text-gray-600 font-medium">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const styles = {
    Sent: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Failed: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
