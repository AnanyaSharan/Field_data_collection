const colorMap = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-blue-100 text-blue-700",
  Assigned: "bg-indigo-100 text-indigo-700",
  "Checklist Completed": "bg-yellow-100 text-yellow-700",
  Authorized: "bg-emerald-100 text-emerald-700",
  Active: "bg-green-100 text-green-700",
  Closed: "bg-gray-200 text-gray-600",
  Cancelled: "bg-red-100 text-red-600",
  Open: "bg-orange-100 text-orange-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Acknowledged: "bg-indigo-100 text-indigo-700",
  Resolved: "bg-green-100 text-green-700",
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
  Normal: "bg-gray-100 text-gray-600",
  Immediate: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status, size = "sm" }) {
  const cls = colorMap[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${size === "xs" ? "text-[10px]" : "text-xs"} ${cls}`}>
      {status}
    </span>
  );
}