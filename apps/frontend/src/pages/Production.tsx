import { useEffect, useState } from "react";
import { getProductionOrders, reserveMaterials, recordProduction, checkAvailability } from "../api/production";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, Badge } from "../components/ui";

export function Production() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [activeModal, setActiveModal] = useState<"check" | "record" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState("");
  
  const [actualQty, setActualQty] = useState<number>(0);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

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
    setCheckError("");
    setReserveError("");
    setActiveModal("check");
    setCheckLoading(true);
    try {
      setAvailabilityCheck(await checkAvailability(order.id));
    } catch {
      setCheckError("Failed to check material availability. Please try again.");
    }
    setCheckLoading(false);
  };

  const handleReserve = async () => {
    setReserveLoading(true);
    setReserveError("");
    try {
      await reserveMaterials(selectedOrder.id);
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setReserveError(err.response?.data?.error || "Failed to reserve materials. Please try again.");
    }
    setReserveLoading(false);
  };

  const openRecord = (order: any) => {
    setSelectedOrder(order);
    setActualQty(Number(order.planned_quantity));
    setRecordError("");
    setActiveModal("record");
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordLoading(true);
    setRecordError("");
    try {
      await recordProduction(selectedOrder.id, Number(actualQty));
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setRecordError(err.response?.data?.error || "Failed to record production output. Please try again.");
    }
    setRecordLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'Ready': return <Badge variant="info">Ready to Produce</Badge>;
      case 'Planned': return <Badge variant="warning">Planned</Badge>;
      case 'In_Progress': return <Badge variant="default">In Progress</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading production orders...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title="Production Operations" 
        description="Manage active production runs, reserve materials, and record output." 
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Order ID</Th>
              <Th>Product</Th>
              <Th className="text-right">Planned Qty</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><Td colSpan={5} className="text-center py-8 text-slate-500 italic">No production orders found.</Td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                <Td className="font-mono text-xs text-slate-500 font-medium">{o.id}</Td>
                <Td>
                  <div className="font-medium text-slate-900">{o.product_name}</div>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">{o.product_sku}</div>
                </Td>
                <Td className="text-right font-semibold">{o.planned_quantity}</Td>
                <Td>{getStatusBadge(o.status)}</Td>
                <Td className="text-right space-x-2">
                  {o.status === "Planned" && (
                    <Button onClick={() => openCheck(o)} variant="secondary" className="px-3 py-1.5 text-xs">
                      Check BOM & Reserve
                    </Button>
                  )}
                  {o.status === "Ready" && (
                    <Button onClick={() => openRecord(o)} variant="primary" className="px-3 py-1.5 text-xs">
                      Record Output
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Availability Modal */}
      {activeModal === "check" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-xl flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">Material Availability (BOM)</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-5 text-sm text-slate-700 bg-slate-50 p-3 rounded-sm border border-slate-200">
                Production Order for <span className="font-bold text-slate-900">{selectedOrder.product_name}</span> (Target: {selectedOrder.planned_quantity} units).
              </div>
              
              {checkLoading ? (
                <div className="text-sm text-slate-500 py-8 text-center animate-pulse">Running inventory allocation check...</div>
              ) : checkError ? (
                <div role="alert" aria-live="assertive" className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{checkError}</div>
              ) : availabilityCheck ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-sm text-sm border flex items-center font-medium ${availabilityCheck.all_available ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {availabilityCheck.all_available ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertTriangle className="w-5 h-5 mr-3" />}
                    {availabilityCheck.all_available ? "Sufficient materials available in warehouse for reservation." : "Insufficient materials available. Purchasing required."}
                  </div>
                  
                  <div className="border border-slate-200 rounded-sm overflow-hidden">
                    <Table>
                      <thead>
                        <tr>
                          <Th>Material ID</Th>
                          <Th className="text-right">Required</Th>
                          <Th className="text-right">Available</Th>
                          <Th className="text-center">Status</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {availabilityCheck.materials.map((m: any) => (
                          <tr key={m.material_id}>
                            <Td className="font-mono text-xs">{m.material_id.substring(0,8)}...</Td>
                            <Td className="text-right font-medium">{m.required}</Td>
                            <Td className="text-right font-medium">{m.available}</Td>
                            <Td className="text-center">
                              {m.is_sufficient ? <span className="text-emerald-600 font-bold text-xs uppercase">OK</span> : <span className="text-red-600 font-bold text-xs uppercase">Short</span>}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3">
              {reserveError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{reserveError}</div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setActiveModal(null)} variant="ghost">Cancel</Button>
                {availabilityCheck?.all_available && (
                  <Button onClick={handleReserve} variant="primary" disabled={reserveLoading}>
                    {reserveLoading ? 'Reserving...' : 'Reserve & Confirm Ready'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Production Modal */}
      {activeModal === "record" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-sm flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">Record Production Output</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form id="record-form" onSubmit={handleRecord} className="space-y-4">
                <div>
                  <Label>Actual Quantity Produced</Label>
                  <Input required type="number" min="0.01" step="0.01" value={actualQty} onChange={e => setActualQty(Number(e.target.value))} />
                  <p className="text-xs text-slate-500 mt-2 font-medium">Target Planned: {selectedOrder.planned_quantity}</p>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3">
              {recordError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{recordError}</div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setActiveModal(null)} variant="ghost">Cancel</Button>
                <Button form="record-form" type="submit" variant="primary" disabled={recordLoading}>
                  {recordLoading ? 'Saving...' : 'Complete Output'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
