import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

export default function PTWCard({ permit, onClick }) {
  const hazardColors = {
    "Hot Work": "bg-red-50 text-red-600 border-red-100",
    "Working at Height": "bg-orange-50 text-orange-600 border-orange-100",
    "Confined Space": "bg-purple-50 text-purple-600 border-purple-100",
    "Electrical": "bg-yellow-50 text-yellow-700 border-yellow-100",
    "Lifting": "bg-blue-50 text-blue-600 border-blue-100",
    "Excavation": "bg-amber-50 text-amber-700 border-amber-100",
    "General": "bg-gray-50 text-gray-600 border-gray-100",
  };
  const hColor = hazardColors[permit.hazard_category] || hazardColors.General;

  return (
    <button onClick={onClick} className="field-card w-full text-left active:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${hColor}`}>
              {permit.hazard_category}
            </span>
            <StatusBadge status={permit.status} size="xs" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
            #{(permit.permit_id || permit.id?.slice(0,8) || "").toUpperCase()} · {permit.order_number}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{permit.contractor_name} · {permit.date}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}