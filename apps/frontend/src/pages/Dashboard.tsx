import { useEffect, useState } from "react";
import { getDashboardSummary } from "../api/dashboard";
import { AlertTriangle, ShoppingCart, Target, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummary(await getDashboardSummary());
      } catch (err) {
        setError("Failed to load dashboard data");
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Operational Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory Alert */}
        <div className="p-4 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
            <h3 className="font-semibold text-sm text-slate-900">Low Stock Materials</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.inventory.low_stock_items.length}</p>
          <p className="text-xs text-slate-500 mt-1">Below minimum threshold</p>
          <div className="mt-3">
            <Link to="/inventory" className="text-xs font-medium text-slate-900 underline hover:text-slate-700">View Inventory</Link>
          </div>
        </div>

        {/* Procurement Alert */}
        <div className="p-4 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center mb-2">
            <ShoppingCart className="w-4 h-4 text-blue-500 mr-2" />
            <h3 className="font-semibold text-sm text-slate-900">Pending PRs</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.procurement.pr_status_counts['Pending'] || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting manager approval</p>
          <div className="mt-3">
            <Link to="/procurement" className="text-xs font-medium text-slate-900 underline hover:text-slate-700">View Requests</Link>
          </div>
        </div>

        {/* Production Alert */}
        <div className="p-4 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center mb-2">
            <Target className="w-4 h-4 text-emerald-500 mr-2" />
            <h3 className="font-semibold text-sm text-slate-900">Active Production</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {(summary.production.order_status_counts['Ready'] || 0) + (summary.production.order_status_counts['In_Progress'] || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Orders in queue or processing</p>
          <div className="mt-3">
            <Link to="/production" className="text-xs font-medium text-slate-900 underline hover:text-slate-700">View Orders</Link>
          </div>
        </div>

        {/* Quality Alert */}
        <div className="p-4 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center mb-2">
            <ShieldAlert className="w-4 h-4 text-red-500 mr-2" />
            <h3 className="font-semibold text-sm text-slate-900">Recent Defects</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.quality.recent_failed_inspections.length}</p>
          <p className="text-xs text-slate-500 mt-1">Recent failed inspections</p>
          <div className="mt-3">
            <Link to="/quality" className="text-xs font-medium text-slate-900 underline hover:text-slate-700">View QC Log</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Detailed List */}
        <div className="bg-white border border-slate-200 rounded-sm">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Critical Inventory Shortages</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-medium">Material</th>
                <th className="px-3 py-2 font-medium text-right">Available</th>
                <th className="px-3 py-2 font-medium text-right">Min Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.inventory.low_stock_items.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500">Stock levels are healthy.</td></tr>
              ) : summary.inventory.low_stock_items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-bold">{item.available_stock}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{item.min_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent QC Failures */}
        <div className="bg-white border border-slate-200 rounded-sm">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Recent Quality Failures</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium text-right">Failed Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.quality.recent_failed_inspections.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500">No recent failures.</td></tr>
              ) : summary.quality.recent_failed_inspections.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-slate-500">{new Date(item.inspection_date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{item.product_name}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-bold">{item.fail_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
