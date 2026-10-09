import { useEffect, useState } from "react";
import { getInspections, getPendingInspections, createInspection, getInspectionDetails } from "../api/quality";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

export function Quality() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"Inspections" | "Pending">("Pending");
  
  const [inspections, setInspections] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [activeModal, setActiveModal] = useState<"inspect" | "details" | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);

  // Form states
  const [passQty, setPassQty] = useState(0);
  const [failQty, setFailQty] = useState(0);
  const [defectReason, setDefectReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "Inspections") setInspections(await getInspections());
        if (activeTab === "Pending") setPending(await getPendingInspections());
      } catch {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, refresh]);

  const openInspect = (record: any) => {
    setSelectedRecord(record);
    setPassQty(Number(record.actual_quantity_produced));
    setFailQty(0);
    setDefectReason("");
    setActiveModal("inspect");
  };

  const openDetails = async (inspection: any) => {
    setActiveModal("details");
    setDetails(null);
    try {
      const data = await getInspectionDetails(inspection.id);
      setDetails(data);
    } catch {
      alert("Failed to load details");
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failQty > 0 && !defectReason) {
      alert("Please provide a defect reason for failed quantity.");
      return;
    }
    setFormLoading(true);
    try {
      const payload: any = {
        production_record_id: selectedRecord.id,
        pass_quantity: passQty,
        fail_quantity: failQty,
      };
      if (failQty > 0) {
        payload.defects = [{ defect_reason: defectReason, quantity: failQty }];
      }
      
      await createInspection(payload);
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create inspection");
    }
    setFormLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Quality Control</h2>
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        <button onClick={() => setActiveTab("Pending")} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'Pending' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Pending Inspections</button>
        <button onClick={() => setActiveTab("Inspections")} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'Inspections' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Inspection Records</button>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

      {!loading && !error && activeTab === "Pending" && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Record ID</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Produced Qty</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No pending inspections.</td></tr> : pending.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{p.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.product_name} <span className="font-mono text-xs text-slate-500 ml-2">{p.product_sku}</span></td>
                  <td className="px-4 py-3">{new Date(p.completion_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">{p.actual_quantity_produced}</td>
                  <td className="px-4 py-3 text-right">
                    {(user?.role === "Admin" || user?.role === "Manager" || user?.role === "QC") && (
                      <button onClick={() => openInspect(p)} className="text-xs bg-slate-900 text-white px-2 py-1 rounded-sm hover:bg-slate-800">Inspect</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === "Inspections" && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Inspection ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Inspector</th>
                <th className="px-4 py-3 font-medium text-right">Pass Qty</th>
                <th className="px-4 py-3 font-medium text-right">Fail Qty</th>
                <th className="px-4 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No inspections found.</td></tr> : inspections.map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{i.id}</td>
                  <td className="px-4 py-3">{new Date(i.inspection_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{i.inspector_name}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{i.pass_quantity}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{i.fail_quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetails(i)} className="text-xs border border-slate-300 text-slate-700 px-2 py-1 rounded-sm hover:bg-slate-50">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Modal */}
      {activeModal === "inspect" && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-sm flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Record Inspection</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="mb-4 text-sm text-slate-600">
                Product: <span className="font-bold text-slate-900">{selectedRecord.product_name}</span><br />
                Total Produced: <span className="font-bold text-slate-900">{selectedRecord.actual_quantity_produced}</span>
              </div>
              <form id="inspect-form" onSubmit={handleInspectSubmit} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-emerald-700 mb-1">Pass Qty</label>
                    <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" 
                      value={passQty} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setPassQty(val);
                        setFailQty(Number(selectedRecord.actual_quantity_produced) - val);
                      }} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-red-700 mb-1">Fail Qty</label>
                    <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" 
                      value={failQty} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFailQty(val);
                        setPassQty(Number(selectedRecord.actual_quantity_produced) - val);
                      }} />
                  </div>
                </div>
                {failQty > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Defect Reason</label>
                    <select required className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={defectReason} onChange={e => setDefectReason(e.target.value)}>
                      <option value="">Select reason...</option>
                      <option value="Scratch/Cosmetic">Scratch/Cosmetic</option>
                      <option value="Assembly Error">Assembly Error</option>
                      <option value="Material Failure">Material Failure</option>
                      <option value="Dimensional Out of Spec">Dimensional Out of Spec</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">Cancel</button>
              <button form="inspect-form" type="submit" disabled={formLoading || passQty + failQty !== Number(selectedRecord.actual_quantity_produced)} className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-sm disabled:opacity-70">
                {formLoading ? 'Saving...' : 'Submit Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {activeModal === "details" && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-md flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Inspection Details</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {!details ? (
                <div className="text-sm text-slate-500">Loading details...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Inspector</p>
                      <p className="font-medium text-slate-900">{details.inspector_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Date</p>
                      <p className="font-medium text-slate-900">{new Date(details.inspection_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Pass Qty</p>
                      <p className="font-medium text-emerald-600">{details.pass_quantity}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Fail Qty</p>
                      <p className="font-medium text-red-600">{details.fail_quantity}</p>
                    </div>
                  </div>

                  {details.defects && details.defects.length > 0 && (
                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <h4 className="font-medium text-slate-900 text-sm mb-3">Defect Records</h4>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2">Reason</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {details.defects.map((d: any) => (
                            <tr key={d.id}>
                              <td className="px-3 py-2">{d.defect_reason}</td>
                              <td className="px-3 py-2 text-right">{d.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {details.finished_goods && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">{details.finished_goods.quantity}</span> items successfully recorded to Finished Goods.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
