import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../Layout/DashboardLayout";
import { FiPlus, FiTrash2, FiEye, FiX } from "react-icons/fi";
import BulkUpload from "../../components/Bulkupload";
import { toast } from "react-toastify";

/* ======================
   Types
====================== */

interface BaseContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

type CampaignStatus = "Draft" | "Pending" | "Sent" | "Failed";

interface CampaignAnalytics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  failed: number;
}

interface Campaign {
  id: number;
  name: string;
  message: string;
  recipients: BaseContact[];
  cost: number;
  date: string;
  status: CampaignStatus;
  analytics: CampaignAnalytics;
}

/* ======================
   Utils
====================== */

const generateId = () => Date.now() + Math.floor(Math.random() * 10000);
const MAX_SMS_LENGTH = 160;

/* ======================
   Component
====================== */

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<BaseContact[]>([]);
  const [credits, setCredits] = useState(1250);

  /* Modals */
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showView, setShowView] = useState<Campaign | null>(null);

  /* New campaign */
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());

  /* Search */
  const [search, setSearch] = useState("");

  /* ======================
     Derived
  ====================== */

  const filteredCampaigns = useMemo(() => {
    const q = search.toLowerCase();
    return campaigns.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const analyticsSummary = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => {
        acc.sent += c.analytics.sent;
        acc.delivered += c.analytics.delivered;
        acc.failed += c.analytics.failed;
        return acc;
      },
      { sent: 0, delivered: 0, failed: 0 }
    );
  }, [campaigns]);

  /* ======================
     Handlers
  ====================== */

  const toggleRecipient = (id: number) => {
    setSelectedRecipients(prev => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  const handlePreview = () => {
    if (!newName.trim() || !newMessage.trim())
      return toast.error("Campaign name and message required");

    if (newMessage.length > MAX_SMS_LENGTH)
      return toast.error(`Message exceeds ${MAX_SMS_LENGTH} characters`);

    if (selectedRecipients.size === 0)
      return toast.error("Select at least one recipient");

    setShowPreview(true);
  };

  const handleCreateCampaign = () => {
    const recipients = contacts.filter(c => selectedRecipients.has(c.id));

    const campaign: Campaign = {
      id: generateId(),
      name: newName.trim(),
      message: newMessage.trim(),
      recipients,
      cost: recipients.length,
      date: new Date().toLocaleDateString(),
      status: "Draft",
      analytics: {
        totalRecipients: recipients.length,
        sent: 0,
        delivered: 0,
        failed: 0,
      },
    };

    setCampaigns(prev => [campaign, ...prev]);
    resetForm();
    setShowPreview(false);
    setShowForm(false);

    toast.success("Campaign created as Draft");
  };

  const sendCampaign = (campaignId: number) => {
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id !== campaignId) return c;

        if (credits < c.cost) {
          toast.error("Insufficient credits");
          return c;
        }

        setCredits(prevCredits => prevCredits - c.cost);

        return {
          ...c,
          status: "Pending",
          analytics: {
            ...c.analytics,
            sent: c.analytics.totalRecipients,
          },
        };
      })
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this campaign?")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("Campaign deleted");
  };

  const resetForm = () => {
    setNewName("");
    setNewMessage("");
    setSelectedRecipients(new Set());
  };

  /* ======================
     Simulate Delivery
  ====================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      setCampaigns(prev =>
        prev.map(c => {
          if (c.status !== "Pending") return c;

          const delivered = Math.floor(c.analytics.sent * 0.9);
          const failed = c.analytics.sent - delivered;

          return {
            ...c,
            status: "Sent",
            analytics: {
              ...c.analytics,
              delivered,
              failed,
            },
          };
        })
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [campaigns]);

  /* ======================
     Render
  ====================== */

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <section className="flex flex-col sm:flex-row justify-between gap-4">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="border px-3 py-2 rounded-xl"
            />
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <FiPlus /> New Campaign
            </button>
          </div>
        </section>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Sent</p>
            <p className="text-xl font-bold">{analyticsSummary.sent}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-xl font-bold">{analyticsSummary.delivered}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-xl font-bold">{analyticsSummary.failed}</p>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-xl w-fit font-semibold">
          💳 Credits: {credits}
        </div>

        {/* Campaign Table / Cards */}
        {filteredCampaigns.length ? (
          <div className="space-y-4">

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow p-6 overflow-auto">
              <div className="overflow-x-auto -mx-6">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Recipients</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Delivered</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Failed</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map(c => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{c.name}</td>
                        <td className="px-4 py-3">{c.analytics.totalRecipients}</td>
                        <td className="px-4 py-3 text-green-600">{c.analytics.delivered}</td>
                        <td className="px-4 py-3 text-red-600">{c.analytics.failed}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              c.status === "Sent"
                                ? "bg-green-100 text-green-700"
                                : c.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setShowView(c)}>
                              <FiEye />
                            </button>
                            {c.status === "Draft" && (
                              <button
                                onClick={() => sendCampaign(c.id)}
                                className="text-green-600 font-medium"
                              >
                                Send
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-red-600"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredCampaigns.map(c => (
                <div key={c.id} className="bg-white p-4 rounded-xl shadow space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{c.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === "Sent"
                          ? "bg-green-100 text-green-700"
                          : c.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{c.message}</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Recipients: {c.analytics.totalRecipients}</span>
                    <span className="text-green-600">Delivered: {c.analytics.delivered}</span>
                    <span className="text-red-600">Failed: {c.analytics.failed}</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setShowView(c)}>
                      <FiEye />
                    </button>
                    {c.status === "Draft" && (
                      <button
                        onClick={() => sendCampaign(c.id)}
                        className="text-green-600 font-medium"
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <p>No campaigns created yet.</p>
        )}

        {/* ======================
            Modals
        ====================== */}

        {/* Create */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 relative">
              <button onClick={() => setShowForm(false)} className="absolute top-3 right-3">
                <FiX />
              </button>

              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Campaign Name"
                className="w-full border p-2 rounded"
              />

              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Message"
                className="w-full border p-2 rounded"
              />

              <p className="text-xs text-gray-500">
                {newMessage.length}/{MAX_SMS_LENGTH}
              </p>

              <div className="max-h-40 overflow-auto border p-2 rounded">
                {contacts.map(c => (
                  <label key={c.id} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.has(c.id)}
                      onChange={() => toggleRecipient(c.id)}
                    />
                    {c.name} ({c.phone})
                  </label>
                ))}
              </div>

              <BulkUpload
                onUpload={uploaded => {
                  setContacts(prev => {
                    const existing = new Set(prev.map(p => p.phone));
                    const unique = uploaded.filter(u => !existing.has(u.phone));

                    return [
                      ...prev,
                      ...unique.map(c => ({
                        id: generateId(),
                        name: c.name,
                        phone: c.phone,
                        email: c.email,
                      })),
                    ];
                  });
                  toast.success("Contacts uploaded");
                }}
              />

              <button
                onClick={handlePreview}
                className="bg-yellow-500 text-white w-full py-2 rounded"
              >
                Preview
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
              <h2 className="font-semibold text-lg">Preview</h2>
              <p>{newMessage}</p>
              <button
                onClick={handleCreateCampaign}
                className="bg-green-600 text-white w-full py-2 rounded"
              >
                Create Campaign
              </button>
            </div>
          </div>
        )}

        {/* View */}
        {showView && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-3 relative">
              <button onClick={() => setShowView(null)} className="absolute top-3 right-3">
                <FiX />
              </button>
              <h2 className="font-semibold">{showView.name}</h2>
              <p>{showView.message}</p>
              <p>Total: {showView.analytics.totalRecipients}</p>
              <p className="text-green-600">Delivered: {showView.analytics.delivered}</p>
              <p className="text-red-600">Failed: {showView.analytics.failed}</p>
              <p>Status: {showView.status}</p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
