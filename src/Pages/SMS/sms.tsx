import { useState } from "react";
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import { toast } from "react-toastify";
import DashboardLayout from "../../Layout/DashboardLayout";
import BulkUpload from "../../components/Bulkupload";
import type { Contact } from "../../types/contact";

interface Template {
  id: number;
  name: string;
  message: string;
}

interface DeliveryStatus {
  contact: Contact;
  status: "pending" | "sent" | "failed";
}

export default function SMSPage() {
  // Single SMS
  const [singlePhone, setSinglePhone] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [senderID, setSenderID] = useState("DEFAULT");

  // Templates
  const [templates, setTemplates] = useState<Template[]>([
    { id: 1, name: "Welcome SMS", message: "Hello! Welcome." },
    { id: 2, name: "Promotion", message: "Check out our offers!" },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Modal state
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Delivery report
  const [deliveryReport, setDeliveryReport] = useState<DeliveryStatus[]>([]);

  // Credits
  const [credits, setCredits] = useState(1250);
  const costPerSMS = 1;

  /* ---------------- SMS Segmentation ---------------- */
  const characterCount = singleMessage.length;
  const segments = characterCount > 160 ? Math.ceil(characterCount / 153) : 1;

  /* ---------------- HANDLERS ---------------- */
  const handleSendSingle = async () => {
    if (!singlePhone.trim()) return toast.error("Phone number is required");
    if (!singleMessage.trim()) return toast.error("Message is required");
    if (credits < costPerSMS) return toast.error("Insufficient credits");

    try {
      const toastId = "single-sms";
      toast.loading("Sending SMS...", { toastId });
      await new Promise((res) => setTimeout(res, 1000));
      setCredits((prev) => prev - costPerSMS);

      toast.update(toastId, {
        render: `SMS sent to ${singlePhone} ✅`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setSinglePhone("");
      setSingleMessage("");
      setSelectedTemplate(null);
    } catch {
      toast.error("Failed to send SMS");
    }
  };

  const handleSendBulk = async () => {
    if (contacts.length === 0) return toast.error("Please add recipients");
    if (!singleMessage.trim()) return toast.error("Message is required");

    const totalCost = contacts.length * costPerSMS;
    if (credits < totalCost) return toast.error("Insufficient credits for bulk SMS");

    const toastId = "bulk-sms";
    toast.loading("Sending bulk SMS...", { toastId });

    try {
      const initialReport: DeliveryStatus[] = contacts.map((c) => ({
        contact: c,
        status: "pending",
      }));
      setDeliveryReport(initialReport);

      for (let i = 0; i < contacts.length; i++) {
        await new Promise((res) => setTimeout(res, 500));
        setDeliveryReport((prev) =>
          prev.map((d) =>
            d.contact.id === contacts[i].id ? { ...d, status: "sent" } : d
          )
        );
      }

      setCredits((prev) => prev - totalCost);
      toast.update(toastId, {
        render: `Bulk SMS sent to ${contacts.length} recipients 🚀`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      setSingleMessage("");
      setSelectedTemplate(null);
      setContacts([]);
    } catch {
      toast.update(toastId, {
        render: "Failed to send bulk SMS",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    setSingleMessage(template.message);
    toast.info(`Template "${template.name}" selected`);
  };

  const handleAddTemplate = () => {
    setEditingTemplate({ id: 0, name: "", message: "" });
  };

  const handleSaveTemplate = (name: string, message: string) => {
    if (editingTemplate?.id === 0) {
      setTemplates((prev) => [...prev, { id: prev.length + 1, name, message }]);
      toast.success("Template added");
    } else {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate?.id ? { ...t, name, message } : t
        )
      );
      toast.success("Template updated");
    }
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: number) => {
    toast.warn(
      ({ closeToast }) => (
        <div className="space-y-2">
          <p>Delete this template?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTemplates((prev) => prev.filter((t) => t.id !== id));
                if (selectedTemplate === id) setSelectedTemplate(null);
                toast.success("Template deleted");
                closeToast?.();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-md"
            >
              Delete
            </button>
            <button onClick={closeToast} className="px-3 py-1 bg-gray-300 rounded-md">
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  /* ---------------- TEMPLATE MODAL ---------------- */
  const TemplateModal = editingTemplate ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4">
        <h3 className="text-lg font-semibold">
          {editingTemplate.id === 0 ? "Add Template" : "Edit Template"}
        </h3>
        <input
          value={editingTemplate.name}
          onChange={(e) =>
            setEditingTemplate((prev) => prev && { ...prev, name: e.target.value })
          }
          className="w-full border px-3 py-2 rounded-lg"
          placeholder="Template Name"
        />
        <textarea
          value={editingTemplate.message}
          onChange={(e) =>
            setEditingTemplate((prev) =>
              prev ? { ...prev, message: e.target.value } : prev
            )
          }
          className="w-full border px-3 py-2 rounded-lg"
          placeholder="Message"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditingTemplate(null)}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              handleSaveTemplate(editingTemplate.name, editingTemplate.message)
            }
            className="px-4 py-2 rounded bg-indigo-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  ) : null;

  /* ---------------- UI ---------------- */

  return (
    <DashboardLayout>
      {TemplateModal}
      <div className="space-y-8">
        {/* Credits & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 rounded-2xl shadow-lg flex items-center justify-center gap-3">
            💳 <span className="font-semibold">Credits Remaining:</span> {credits}
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-5 rounded-2xl shadow-lg flex items-center justify-center gap-3">
            💰 <span className="font-semibold">Cost per SMS:</span> {costPerSMS}
          </div>
        </div>

        {/* Templates */}
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Message Templates
            </h2>
            <button
              onClick={handleAddTemplate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              <FiPlus /> Add Template
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border cursor-pointer ${
                  selectedTemplate === t.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span onClick={() => handleTemplateSelect(t.id)}>{t.name}</span>
                <FiEdit
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setEditingTemplate(t)}
                />
                <FiTrash2
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteTemplate(t.id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Single SMS */}
        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">Send Single SMS</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Phone number"
              value={singlePhone}
              onChange={(e) => setSinglePhone(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Sender ID"
              value={senderID}
              onChange={(e) => setSenderID(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <textarea
            placeholder="Message"
            value={singleMessage}
            onChange={(e) => setSingleMessage(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-gray-500 text-sm">
            Characters: {characterCount} | Segments: {segments}
          </p>

          <button
            onClick={handleSendSingle}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700"
          >
            Send SMS
          </button>
        </section>

        {/* Bulk SMS */}
        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Send Bulk SMS</h2>

          <BulkUpload
            onUpload={(uploaded) => {
              setContacts((prev) => [
                ...prev,
                ...uploaded.map((c, i) => ({
                  id: prev.length + i + 1,
                  ...c,
                })),
              ]);
              toast.success(`${uploaded.length} contacts added`);
            }}
          />

          <p className="text-gray-600">
            Total recipients: <span className="font-medium">{contacts.length}</span>{" "}
            | Estimated cost: <span className="font-medium">{contacts.length * costPerSMS}</span>
          </p>

          <textarea
            placeholder="Message"
            value={singleMessage}
            onChange={(e) => setSingleMessage(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-gray-500 text-sm">
            Characters: {characterCount} | Segments: {segments}
          </p>

          <button
            onClick={handleSendBulk}
            disabled={contacts.length === 0 || !singleMessage}
            className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 disabled:opacity-60"
          >
            Send Bulk SMS
          </button>

          {/* Delivery Report */}
          {deliveryReport.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800">Delivery Report</h3>
              <table className="w-full mt-2 border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Phone</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryReport.map((d) => (
                    <tr key={d.contact.id}>
                      <td className="p-2 border">{d.contact.phone}</td>
                      <td className="p-2 border capitalize">
                        {d.status === "sent" ? (
                          <span className="text-green-600 font-medium">Sent</span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
