import { useEffect, useState } from "react";
import { getSuppliers, getPRs, approvePR, getPOs } from "../api/procurement";
import { useAuthStore } from "../store/useAuthStore";

export function Procurement() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"PR" | "PO" | "Supplier">("PR");
  
  const [prs, setPrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "PR") setPrs(await getPRs());
        if (activeTab === "PO") setPos(await getPOs());
        if (activeTab === "Supplier") setSuppliers(await getSuppliers());
      } catch {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, refresh]);

  const handleApprovePR = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await approvePR(id, status);
      setRefresh(r => r + 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update PR");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Procurement Management</h2>
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        <button onClick={() => setActiveTab("PR")} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'PR' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Purchase Requests</button>
        <button onClick={() => setActiveTab("PO")} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'PO' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Purchase Orders</button>
        <button onClick={() => setActiveTab("Supplier")} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'Supplier' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Suppliers</button>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

      {!loading && !error && activeTab === "PR" && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">PR ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prs.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No PRs found.</td></tr> : prs.map(pr => (
                <tr key={pr.id}>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{pr.id}</td>
                  <td className="px-4 py-3">{new Date(pr.request_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{pr.requester_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : pr.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{pr.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {pr.status === "Pending" && (user?.role === "Admin" || user?.role === "Manager") && (
                      <>
                        <button onClick={() => handleApprovePR(pr.id, "Approved")} className="text-xs bg-slate-900 text-white px-2 py-1 rounded-sm hover:bg-slate-800">Approve</button>
                        <button onClick={() => handleApprovePR(pr.id, "Rejected")} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-sm hover:bg-red-200">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === "PO" && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">PO ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pos.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No POs found.</td></tr> : pos.map(po => (
                <tr key={po.id}>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{po.id}</td>
                  <td className="px-4 py-3">{new Date(po.issue_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{po.supplier_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{po.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === "Supplier" && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact Info</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No suppliers found.</td></tr> : suppliers.map(sup => (
                <tr key={sup.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{sup.name}</td>
                  <td className="px-4 py-3 text-slate-600">{sup.contact_info}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sup.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>{sup.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
