interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {value}
          </h3>
          {trend && (
            <p className="text-xs text-green-600 mt-1">
              {trend}
            </p>
          )}
        </div>

        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
