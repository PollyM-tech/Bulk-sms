import DashboardLayout from "../../Layout/DashboardLayout";
import { FiSend, FiFileText, FiBarChart2, FiCreditCard } from "react-icons/fi";

export default function DashboardPage() {
  const stats = {
    totalSMS: 12500,
    delivered: 11000,
    failed: 500,
    credits: 1250,
  };

  const recentCampaigns = [
    { id: 1, name: "Promo Jan", date: "2025-12-01", status: "Sent" },
    { id: 2, name: "Holiday Sale", date: "2025-12-05", status: "Scheduled" },
    { id: 3, name: "New Year Offer", date: "2025-12-10", status: "Draft" },
  ];

  const recentTemplates = [
    { id: 1, name: "Welcome SMS" },
    { id: 2, name: "Promotion Template" },
    { id: 3, name: "Verification Code" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center gap-4">
            <FiSend className="w-10 h-10" />
            <div>
              <p className="text-sm opacity-80">Total SMS Sent</p>
              <p className="text-2xl font-bold">{stats.totalSMS}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center gap-4">
            <FiBarChart2 className="w-10 h-10" />
            <div>
              <p className="text-sm opacity-80">Delivered vs Failed</p>
              <p className="text-2xl font-bold">
                {stats.delivered} / {stats.failed}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center gap-4">
            <FiCreditCard className="w-10 h-10" />
            <div>
              <p className="text-sm opacity-80">Credits Remaining</p>
              <p className="text-2xl font-bold">{stats.credits}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-2xl transition">
            <p className="text-gray-500 text-sm mb-3">Quick Actions</p>
            <button className="bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-700 transition font-medium">
              Send SMS
            </button>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Campaigns
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3">Name</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-indigo-50 transition">
                    <td className="py-3 font-medium text-gray-700">{c.name}</td>
                    <td className="py-3 text-gray-500">{c.date}</td>
                    <td className={`py-3 font-semibold ${c.status === 'Sent' ? 'text-green-600' : c.status === 'Scheduled' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Templates */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Templates
          </h3>
          <div className="flex flex-wrap gap-3">
            {recentTemplates.map(t => (
              <div
                key={t.id}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-100 transition"
              >
                <FiFileText className="w-4 h-4" />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
