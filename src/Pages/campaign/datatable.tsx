import { useMemo, useState } from "react";
import { FiTrash2, FiChevronUp, FiChevronDown } from "react-icons/fi";

/* =========================
   Types
========================= */

export type CampaignStatus = "Draft" | "Pending" | "Sent" | "Failed";

export interface Campaign {
  id: number;
  name: string;
  message: string;
  status: CampaignStatus;
  analytics: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    failed: number;
  };
}

type SortKey =
  | "name"
  | "recipients"
  | "delivered"
  | "failed"
  | "deliveryRate"
  | "status";

interface Props {
  data: Campaign[];
  onView: (campaign: Campaign) => void;
  onSend: (id: number) => void;
  onDelete: (id: number) => void;
}

/* =========================
   Helper Component
========================= */

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) return null;
  return direction === "asc" ? <FiChevronUp /> : <FiChevronDown />;
}

/* =========================
   Component
========================= */

export default function DataTable({
  data,
  onView,
  onSend,
  onDelete,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: number | string = "";
      let bVal: number | string = "";

      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "recipients":
          aVal = a.analytics.totalRecipients;
          bVal = b.analytics.totalRecipients;
          break;
        case "delivered":
          aVal = a.analytics.delivered;
          bVal = b.analytics.delivered;
          break;
        case "failed":
          aVal = a.analytics.failed;
          bVal = b.analytics.failed;
          break;
        case "deliveryRate":
          aVal = a.analytics.sent
            ? a.analytics.delivered / a.analytics.sent
            : 0;
          bVal = b.analytics.sent
            ? b.analytics.delivered / b.analytics.sent
            : 0;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, direction]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow overflow-x-auto">
      <table className="min-w-full table-fixed text-sm">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr className="border-b">
            <th
              onClick={() => toggleSort("name")}
              className="px-4 py-3 w-[25%] text-left cursor-pointer"
            >
              Name{" "}
              <SortIcon
                active={sortKey === "name"}
                direction={direction}
              />
            </th>

            <th
              onClick={() => toggleSort("recipients")}
              className="px-4 py-3 w-[10%] text-center cursor-pointer"
            >
              Recipients{" "}
              <SortIcon
                active={sortKey === "recipients"}
                direction={direction}
              />
            </th>

            <th
              onClick={() => toggleSort("delivered")}
              className="px-4 py-3 w-[10%] text-center cursor-pointer"
            >
              Delivered{" "}
              <SortIcon
                active={sortKey === "delivered"}
                direction={direction}
              />
            </th>

            <th
              onClick={() => toggleSort("failed")}
              className="px-4 py-3 w-[10%] text-center cursor-pointer"
            >
              Failed{" "}
              <SortIcon
                active={sortKey === "failed"}
                direction={direction}
              />
            </th>

            <th
              onClick={() => toggleSort("deliveryRate")}
              className="px-4 py-3 w-[10%] text-center cursor-pointer"
            >
              Rate{" "}
              <SortIcon
                active={sortKey === "deliveryRate"}
                direction={direction}
              />
            </th>

            <th
              onClick={() => toggleSort("status")}
              className="px-4 py-3 w-[10%] text-center cursor-pointer"
            >
              Status{" "}
              <SortIcon
                active={sortKey === "status"}
                direction={direction}
              />
            </th>

            <th className="px-4 py-3 w-[15%] text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedData.map(c => {
            const rate = c.analytics.sent
              ? Math.round(
                  (c.analytics.delivered / c.analytics.sent) * 100
                )
              : 0;

            return (
              <tr
                key={c.id}
                className="border-b hover:bg-gray-50"
                onClick={() => onView(c)}
              >
                <td className="px-4 py-2 truncate">
                  {c.name}
                </td>

                <td className="px-4 py-2 text-center">
                  {c.analytics.totalRecipients}
                </td>

                <td className="px-4 py-2 text-center text-green-600">
                  {c.analytics.delivered}
                </td>

                <td className="px-4 py-2 text-center text-red-600">
                  {c.analytics.failed}
                </td>

                <td className="px-4 py-2 text-center">
                  {rate}%
                </td>

                <td className="px-4 py-2 text-center">
                  {c.status}
                </td>

                <td
                  className="px-4 py-2 text-center"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-center gap-3">
                    {c.status === "Draft" && (
                      <button
                        onClick={() => onSend(c.id)}
                        className="text-green-600 font-medium"
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
