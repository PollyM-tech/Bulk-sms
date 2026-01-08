import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../Layout/DashboardLayout";
import BulkUpload from "../../components/Bulkupload";
import { FiTrash2, FiSearch, FiEdit } from "react-icons/fi";

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");

  // EDIT CONTACT STATES
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  /* ---------------- DELETE CONTACT ---------------- */
  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact deleted");
  };

  /* ---------------- OPEN EDIT MODAL ---------------- */
  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setIsEditOpen(true);
  };

  /* ---------------- SAVE EDIT ---------------- */
  const saveEdit = () => {
    if (!editContact) return;
    if (!editContact.name || !editContact.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setContacts((prev) =>
      prev.map((c) => (c.id === editContact.id ? editContact : c))
    );
    setIsEditOpen(false);
    toast.success("Contact updated");
  };

  /* ---------------- FILTERED CONTACTS ---------------- */
  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
      ),
    [contacts, search]
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Page Header */}
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
        </section>

        {/* Bulk Upload Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Manage Contacts</h2>

          {/* Bulk Upload */}
          <BulkUpload
            onUpload={(uploaded) => {
              setContacts((prev) => [
                ...prev,
                ...uploaded.map((c, i) => ({
                  id: prev.length + i + 1,
                  name: c.name,
                  phone: c.phone,
                  email: c.email,
                })),
              ]);
              toast.success(`${uploaded.length} contacts added`);
            }}
          />

          {/* Search */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-2 border rounded-lg p-2 mt-2 bg-gray-50">
              <FiSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          )}

          {/* Contact List */}
          {filteredContacts.length > 0 ? (
            <div className="mt-4 overflow-auto border rounded-lg shadow-sm bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b">Name</th>
                    <th className="px-4 py-2 border-b">Phone</th>
                    <th className="px-4 py-2 border-b">Email</th>
                    <th className="px-4 py-2 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-indigo-50 transition">
                      <td className="px-4 py-2">{contact.name}</td>
                      <td className="px-4 py-2">{contact.phone}</td>
                      <td className="px-4 py-2">{contact.email || "-"}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : contacts.length > 0 ? (
            <p className="mt-4 text-gray-500 text-sm">No contacts match your search.</p>
          ) : null}
        </section>

        {/* ---------------- EDIT MODAL ---------------- */}
        {isEditOpen && editContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Contact</h3>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={editContact.name}
                  onChange={(e) =>
                    setEditContact({ ...editContact, name: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={editContact.phone}
                  onChange={(e) =>
                    setEditContact({ ...editContact, phone: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editContact.email || ""}
                  onChange={(e) =>
                    setEditContact({ ...editContact, email: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
