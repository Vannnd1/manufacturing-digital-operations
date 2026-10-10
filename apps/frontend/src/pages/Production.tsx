import { useEffect, useState, useCallback } from "react";
import { getProductionOrders, createProductionOrder, reserveMaterials, recordProduction, checkAvailability } from "../api/production";
import { getProducts } from "../api/product";
import { getMaterials } from "../api/inventory";
import { useAuthStore } from "../store/useAuthStore";
import { X, CheckCircle, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, Badge } from "../components/ui";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface Material {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface BomItem {
  material_id: string;
  required_quantity: string; // string while editing; converted to number on submit
}

export function Production() {
  const { user } = useAuthStore();
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

  // ── Create Production Order form state ─────────────────────────────────
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orderProductId, setOrderProductId] = useState("");
  const [orderPlannedQty, setOrderPlannedQty] = useState("");
  const [bomItems, setBomItems] = useState<BomItem[]>([{ material_id: "", required_quantity: "" }]);
  const [createFormError, setCreateFormError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Fetch master data once for the create form dropdowns
  useEffect(() => {
    getProducts().then((d: Product[]) => setProducts(d)).catch(() => {});
    getMaterials().then((d: Material[]) => setMaterials(d)).catch(() => {});
  }, []);

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

  // ── Create Production Order handlers ───────────────────────────────────

  const openCreateOrder = useCallback(() => {
    setOrderProductId("");
    setOrderPlannedQty("");
    setBomItems([{ material_id: "", required_quantity: "" }]);
    setCreateFormError("");
    setShowCreateOrder(true);
  }, []);

  const closeCreateOrder = useCallback(() => {
    setShowCreateOrder(false);
  }, []);

  const updateBomItem = (index: number, field: keyof BomItem, value: string) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addBomItem = () => setBomItems(prev => [...prev, { material_id: "", required_quantity: "" }]);

  const removeBomItem = (index: number) => setBomItems(prev => prev.filter((_, i) => i !== index));

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError("");

    // Client-side validation
    if (!orderProductId) { setCreateFormError("Please select a product."); return; }
    const qty = Number(orderPlannedQty);
    if (!orderPlannedQty || isNaN(qty) || qty <= 0) { setCreateFormError("Planned quantity must be a positive number."); return; }

    for (let i = 0; i < bomItems.length; i++) {
      const item = bomItems[i];
      if (!item.material_id) { setCreateFormError(`BOM row ${i + 1}: please select a material.`); return; }
      const rq = Number(item.required_quantity);
      if (!item.required_quantity || isNaN(rq) || rq <= 0) { setCreateFormError(`BOM row ${i + 1}: required quantity must be a positive number.`); return; }
    }

    const matIds = bomItems.map(it => it.material_id);
    if (new Set(matIds).size !== matIds.length) { setCreateFormError("Each material may only appear once in the BOM. Remove the duplicate."); return; }

    setCreateSubmitting(true);
    try {
      await createProductionOrder({
        product_id: orderProductId,
        planned_quantity: qty,
        materials: bomItems.map(it => ({
          material_id: it.material_id,
          required_quantity: Number(it.required_quantity),
        })),
      });
      closeCreateOrder();
      setRefresh(r => r + 1);
    } catch (err: any) {
      setCreateFormError(
        err.response?.data?.error || "Failed to create production order. Please try again."
      );
    }
    setCreateSubmitting(false);
  };

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

  const canCreate = user?.role === "Admin" || user?.role === "Manager" || user?.role === "Production";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header with New Order action */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Production Operations"
          description="Manage active production runs, reserve materials, and record output."
        />
        {canCreate && (
          <Button onClick={openCreateOrder} variant="primary" className="shrink-0 ml-4">
            <Plus className="w-4 h-4 mr-1.5" />
            New Order
          </Button>
        )}
      </div>

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
                          <Th>Material</Th>
                          <Th className="text-right">Required</Th>
                          <Th className="text-right">Available</Th>
                          <Th className="text-right">Shortage</Th>
                          <Th className="text-center">Status</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {availabilityCheck.materials.map((m: any) => {
                          const shortage = m.is_sufficient ? 0 : m.required - m.available;
                          const unit = m.unit ?? "";
                          return (
                            <tr key={m.material_id}>
                              <Td>
                                {m.material_name
                                  ? (
                                    <div>
                                      <div className="font-medium text-slate-900">{m.material_name}</div>
                                      {m.material_sku && (
                                        <div className="font-mono text-xs text-slate-500 mt-0.5">{m.material_sku}</div>
                                      )}
                                    </div>
                                  )
                                  : (
                                    <span className="font-mono text-xs text-slate-400" title={m.material_id}>
                                      {m.material_id.substring(0, 8)}… <span className="text-slate-300">(name unavailable)</span>
                                    </span>
                                  )
                                }
                              </Td>
                              <Td className="text-right font-medium tabular-nums">
                                {m.required} <span className="text-slate-400 text-xs">{unit}</span>
                              </Td>
                              <Td className="text-right font-medium tabular-nums">
                                {m.available} <span className="text-slate-400 text-xs">{unit}</span>
                              </Td>
                              <Td className="text-right tabular-nums">
                                {m.is_sufficient
                                  ? <span className="text-slate-300 text-xs">—</span>
                                  : <span className="text-red-600 font-semibold">−{shortage} <span className="font-normal text-xs">{unit}</span></span>
                                }
                              </Td>
                              <Td className="text-center">
                                {m.is_sufficient
                                  ? <span className="text-emerald-600 font-bold text-xs uppercase">OK</span>
                                  : <span className="text-red-600 font-bold text-xs uppercase">Short</span>
                                }
                              </Td>
                            </tr>
                          );
                        })}
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
                  <Label htmlFor="record-actual-qty">Actual Quantity Produced</Label>
                  <Input id="record-actual-qty" required type="number" min="0.01" step="0.01" value={actualQty} onChange={e => setActualQty(Number(e.target.value))} />
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

      {/* ── Create Production Order Modal ─────────────────────────────────── */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-2xl flex flex-col border border-slate-200 rounded-sm max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h3 className="font-semibold text-slate-900 tracking-tight">New Production Order</h3>
              <button onClick={closeCreateOrder} className="text-slate-400 hover:text-slate-900 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-6">

                {/* Product + Planned Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order-product">Product</Label>
                    <select
                      id="order-product"
                      required
                      value={orderProductId}
                      onChange={e => setOrderProductId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-shadow"
                    >
                      <option value="">Select product…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="order-planned-qty">Planned Quantity</Label>
                    <Input
                      id="order-planned-qty"
                      type="number"
                      min="0.001"
                      step="any"
                      required
                      placeholder="0"
                      value={orderPlannedQty}
                      onChange={e => setOrderPlannedQty(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bill of Materials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Bill of Materials (BOM)</span>
                    <span className="text-xs text-slate-400">At least 1 material required</span>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_140px_32px] gap-3 mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Material</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Required Qty</span>
                    <span />
                  </div>

                  <div className="space-y-3">
                    {bomItems.map((item, index) => {
                      const selectedMatIds = bomItems.map(it => it.material_id).filter((_, i) => i !== index);
                      const selectedMat = materials.find(m => m.id === item.material_id);
                      return (
                        <div key={index} className="grid grid-cols-[1fr_140px_32px] gap-3 items-start">
                          <div>
                            <label htmlFor={`bom-mat-${index}`} className="sr-only">Material {index + 1}</label>
                            <select
                              id={`bom-mat-${index}`}
                              required
                              value={item.material_id}
                              onChange={e => updateBomItem(index, "material_id", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-shadow"
                            >
                              <option value="">Select material…</option>
                              {materials.map(m => (
                                <option key={m.id} value={m.id} disabled={selectedMatIds.includes(m.id)}>
                                  {m.name} ({m.sku})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`bom-qty-${index}`} className="sr-only">
                              Required quantity for {selectedMat?.name ?? `item ${index + 1}`}
                            </label>
                            <div className="flex items-center gap-1.5">
                              <Input
                                id={`bom-qty-${index}`}
                                type="number"
                                min="0.001"
                                step="any"
                                required
                                placeholder="0"
                                value={item.required_quantity}
                                onChange={e => updateBomItem(index, "required_quantity", e.target.value)}
                              />
                              {selectedMat && (
                                <span className="text-xs text-slate-400 whitespace-nowrap">{selectedMat.unit}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBomItem(index)}
                            disabled={bomItems.length === 1}
                            className="mt-0.5 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Remove BOM row ${index + 1}`}
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addBomItem}
                    className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium transition-colors mt-3"
                  >
                    <Plus className="w-4 h-4" />
                    Add material
                  </button>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
              {createFormError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">
                  {createFormError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={closeCreateOrder} variant="ghost" type="button">Cancel</Button>
                <Button
                  form="create-order-form"
                  type="submit"
                  variant="primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Creating…" : "Create Order"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
