import { useEffect, useState } from "react";
import { getProductionOrders, reserveMaterials, recordProduction, checkAvailability } from "../api/production";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

export function Production() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [activeModal, setActiveModal] = useState<"check" | "record" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  
  const [actualQty, setActualQty] = useState<number>(0);
  const [recordLoading, setRecordLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setOrders(await getProductionOrders());
      } catch {
        setError("Failed to load production orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [refresh]);

  const openCheck = async (order: any) => {
    setSelectedOrder(order);
    setAvailabilityCheck(null);
    setActiveModal("check");
    setCheckLoading(true);
    try {
      const data = await checkAvailability(order.id);
      setAvailabilityCheck(data);
    } catch {
      alert("Failed to check availability");
    }
    setCheckLoading(false);
  };

  const handleReserve = async () => {
    setReserveLoading(true);
    try {
      await reserveMaterials(selectedOrder.id);
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reserve materials");
    }
    setReserveLoading(false);
  };

  const openRecord = (order: any) => {
    setSelectedOrder(order);
    setActualQty(Number(order.planned_quantity));
    setActiveModal("record");
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordLoading(true);
    try {
      await recordProduction(selectedOrder.id, Number(actualQty));
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record production");
    }
    setRecordLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Production Operations</h2>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

      {!loading && !error && (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Planned Qty</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No production orders found.</td></tr> : orders.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{o.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{o.product_name} <span className="font-mono text-xs text-slate-500 ml-2">{o.product_sku}</span></td>
                  <td className="px-4 py-3 text-right">{o.planned_quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                      o.status === 'Ready' ? 'bg-blue-100 text-blue-800' : 
                      o.status === 'Planned' ? 'bg-amber-100 text-amber-800' : 
                      'bg-slate-100 text-slate-800'
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {o.status === "Planned" && (
                      <button onClick={() => openCheck(o)} className="text-xs border border-slate-300 text-slate-700 px-2 py-1 rounded-sm hover:bg-slate-50">Check & Reserve</button>
                    )}
                    {o.status === "Ready" && (
                      <button onClick={() => openRecord(o)} className="text-xs bg-slate-900 text-white px-2 py-1 rounded-sm hover:bg-slate-800">Record Production</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Availability Modal */}
      {activeModal === "check" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-lg flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Material Availability Check</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-4 text-sm text-slate-600">Production Order for <span className="font-bold text-slate-900">{selectedOrder.product_name}</span> ({selectedOrder.planned_quantity} qty).</div>
              
              {checkLoading ? (
                <div className="text-sm text-slate-500 py-4 text-center">Checking inventory...</div>
              ) : availabilityCheck ? (
                <div>
                  <div className={`p-3 mb-4 rounded-sm text-sm border flex items-center ${availabilityCheck.all_available ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {availabilityCheck.all_available ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    {availabilityCheck.all_available ? "Sufficient materials available for reservation." : "Insufficient materials available. Cannot proceed."}
                  </div>
                  
                  <table className="w-full text-sm text-left border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Material ID</th>
                        <th className="px-3 py-2 text-right">Required</th>
                        <th className="px-3 py-2 text-right">Available</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {availabilityCheck.materials.map((m: any) => (
                        <tr key={m.material_id}>
                          <td className="px-3 py-2 font-mono text-xs">{m.material_id.substring(0,8)}...</td>
                          <td className="px-3 py-2 text-right">{m.required}</td>
                          <td className="px-3 py-2 text-right font-medium">{m.available}</td>
                          <td className="px-3 py-2 text-center">
                            {m.is_sufficient ? <span className="text-emerald-600 font-medium text-xs">OK</span> : <span className="text-red-600 font-medium text-xs">Short</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">Cancel</button>
              {availabilityCheck?.all_available && (
                <button onClick={handleReserve} disabled={reserveLoading} className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-sm disabled:opacity-70">
                  {reserveLoading ? 'Reserving...' : 'Reserve & Confirm Ready'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Production Modal */}
      {activeModal === "record" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-sm flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Record Production</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <form id="record-form" onSubmit={handleRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Actual Quantity Produced</label>
                  <input required type="number" min="0.01" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={actualQty} onChange={e => setActualQty(Number(e.target.value))} />
                  <p className="text-xs text-slate-500 mt-1">Planned: {selectedOrder.planned_quantity}</p>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">Cancel</button>
              <button form="record-form" type="submit" disabled={recordLoading} className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-sm disabled:opacity-70">
                {recordLoading ? 'Saving...' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
