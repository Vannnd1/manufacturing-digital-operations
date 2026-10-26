import { useEffect, useState, useCallback } from "react";
import { getSuppliers, getPRs, approvePR, getPOs, createPR, createPO, createGR } from "../api/procurement";
import { getMaterials } from "../api/inventory";
import { useAuthStore } from "../store/useAuthStore";
import { PageHeader, Card, Table, Th, Td, Button, Badge, Input } from "../components/ui";
import { sanitizeNumberInput } from "../utils/number";
import { Plus, Trash2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface PRItem {
  material_id: string;
  quantity: string; // kept as string while editing; converted to number on submit
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Procurement() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"PR" | "PO" | "Supplier">("PR");

  const [prs, setPrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [refresh, setRefresh] = useState(0);

  // ── Create PR modal state ──
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [prItems, setPrItems] = useState<PRItem[]>([{ material_id: "", quantity: "" }]);
  const [prFormError, setPrFormError] = useState("");
  const [prSubmitting, setPrSubmitting] = useState(false);

  // ── Create PO modal state ──
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItems, setPoItems] = useState<Array<{ material_id: string; material_name: string; unit: string; quantity: number; unit_price: string }>>([]);
  const [poFormError, setPoFormError] = useState("");
  const [poSubmitting, setPoSubmitting] = useState(false);

  // ── Receive Goods modal state ──
  const [showReceivePO, setShowReceivePO] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [grItems, setGrItems] = useState<Array<{ po_item_id: string; material_name: string; unit: string; ordered_quantity: number; received_quantity: string }>>([]);
  const [grFormError, setGrFormError] = useState("");
  const [grSubmitting, setGrSubmitting] = useState(false);

  // ── Fetch master data once ──
  useEffect(() => {
    getMaterials()
      .then((data: Material[]) => setMaterials(data))
      .catch(() => {});
    getSuppliers()
      .then((data: any[]) => setSuppliers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setActionError("");
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
    setActionError("");
    try {
      await approvePR(id, status);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Failed to update PR status. Please try again.");
    }
  };

  // ── PR form helpers ──────────────────────────────────────────────────────

  const openCreatePR = useCallback(() => {
    setPrItems([{ material_id: "", quantity: "" }]);
    setPrFormError("");
    setShowCreatePR(true);
  }, []);

  const closeCreatePR = useCallback(() => {
    setShowCreatePR(false);
  }, []);

  const updatePrItem = (index: number, field: keyof PRItem, value: string) => {
    setPrItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addPrItem = () => {
    setPrItems(prev => [...prev, { material_id: "", quantity: "" }]);
  };

  const removePrItem = (index: number) => {
    setPrItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrFormError("");

    // Client-side validation
    for (let i = 0; i < prItems.length; i++) {
      const item = prItems[i];
      if (!item.material_id) {
        setPrFormError(`Row ${i + 1}: please select a material.`);
        return;
      }
      const qty = Number(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        setPrFormError(`Row ${i + 1}: quantity must be a positive number.`);
        return;
      }
    }

    // Duplicate material check
    const ids = prItems.map(it => it.material_id);
    if (new Set(ids).size !== ids.length) {
      setPrFormError("Each material may only appear once per request. Remove the duplicate.");
      return;
    }

    setPrSubmitting(true);
    try {
      await createPR({
        items: prItems.map(it => ({
          material_id: it.material_id,
          quantity: Number(it.quantity),
        })),
      });
      closeCreatePR();
      // Switch to PR tab and refresh the list
      setActiveTab("PR");
      setRefresh(r => r + 1);
    } catch (err: any) {
      setPrFormError(
        err.response?.data?.error || "Failed to create purchase request. Please try again."
      );
    }
    setPrSubmitting(false);
  };

  // ── PO form helpers ──────────────────────────────────────────────────────
  const openCreatePO = (pr: any) => {
    setSelectedPR(pr);
    setPoSupplierId(suppliers.find(s => s.is_active)?.id || suppliers[0]?.id || "");
    setPoItems(
      (pr.items || []).map((it: any) => {
        const matchedMat = materials.find(
          m => m.id === it.material_id || (it.material_name && m.name.toLowerCase() === it.material_name.toLowerCase())
        );
        return {
          material_id: it.material_id || matchedMat?.id || "",
          material_name: it.material_name || matchedMat?.name || "Unknown Material",
          unit: it.unit || matchedMat?.unit || "pcs",
          quantity: Number(it.quantity),
          unit_price: "10.00",
        };
      })
    );
    setPoFormError("");
    setShowCreatePO(true);
  };

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoFormError("");

    if (!poSupplierId) {
      setPoFormError("Please select a supplier.");
      return;
    }

    for (let i = 0; i < poItems.length; i++) {
      if (!poItems[i].material_id) {
        setPoFormError(`Item ${poItems[i].material_name || i + 1}: Material ID is missing. Please reload.`);
        return;
      }
      const price = Number(poItems[i].unit_price);
      if (isNaN(price) || price <= 0) {
        setPoFormError(`Item ${poItems[i].material_name}: unit price must be greater than zero.`);
        return;
      }
    }

    setPoSubmitting(true);
    try {
      await createPO({
        pr_id: selectedPR.id,
        supplier_id: poSupplierId,
        items: poItems.map(it => ({
          material_id: it.material_id,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
        })),
      });
      setShowCreatePO(false);
      setActiveTab("PO");
      setRefresh(r => r + 1);
    } catch (err: any) {
      const details = err.response?.data?.details;
      let errorMsg = err.response?.data?.error || "Failed to create Purchase Order.";
      if (Array.isArray(details) && details.length > 0) {
        const detailStr = details.map((d: any) => `${d.path?.join(".") || "field"}: ${d.message}`).join(", ");
        errorMsg += ` (${detailStr})`;
      }
      setPoFormError(errorMsg);
    }
    setPoSubmitting(false);
  };

  // ── Goods Receipt form helpers ───────────────────────────────────────────
  const openReceivePO = (po: any) => {
    setSelectedPO(po);
    setGrItems(
      (po.items || []).map((it: any) => ({
        po_item_id: it.po_item_id,
        material_name: it.material_name,
        unit: it.unit,
        ordered_quantity: Number(it.quantity),
        received_quantity: String(Number(it.quantity)),
      }))
    );
    setGrFormError("");
    setShowReceivePO(true);
  };

  const handleReceivePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrFormError("");

    for (let i = 0; i < grItems.length; i++) {
      const it = grItems[i];
      const rawVal = String(it.received_quantity).replace(",", ".");
      const received = Number(rawVal);
      if (isNaN(received) || received <= 0) {
        setGrFormError(`Item ${it.material_name}: received quantity must be a positive number.`);
        return;
      }
      if (received > it.ordered_quantity) {
        setGrFormError(`Item ${it.material_name}: received quantity (${received}) cannot exceed ordered quantity (${it.ordered_quantity}).`);
        return;
      }
    }

    setGrSubmitting(true);
    try {
      await createGR({
        po_id: selectedPO.id,
        items: grItems.map(it => ({
          po_item_id: it.po_item_id,
          received_quantity: Number(String(it.received_quantity).replace(",", ".")),
        })),
      });
      setShowReceivePO(false);
      setRefresh(r => r + 1);
    } catch (err: any) {
      const details = err.response?.data?.details;
      let errorMsg = err.response?.data?.error || "Failed to record Goods Receipt.";
      if (Array.isArray(details) && details.length > 0) {
        const detailStr = details.map((d: any) => `${d.path?.join(".") || "field"}: ${d.message}`).join(", ");
        errorMsg += ` (${detailStr})`;
      } else if (typeof details === "string" && details !== errorMsg) {
        errorMsg += ` (${details})`;
      }
      setGrFormError(errorMsg);
    }
    setGrSubmitting(false);
  };

  // ── Status badges ────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":  return <Badge variant="success">Approved</Badge>;
      case "Pending":   return <Badge variant="warning">Pending</Badge>;
      case "Rejected":  return <Badge variant="error">Rejected</Badge>;
      case "Fulfilled": return <Badge variant="info">Fulfilled</Badge>;
      case "Issued":    return <Badge variant="warning">Issued</Badge>;
      case "Completed": return <Badge variant="success">Completed</Badge>;
      default:          return <Badge variant="default">{status}</Badge>;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header with Create PR action */}
      <div className="flex items-start justify-between mb-4">
        <PageHeader
          title="Procurement Management"
          description="Manage purchase requests, purchase orders, and supplier information."
        />
        {activeTab === "PR" && (
          <button 
            onClick={openCreatePR} 
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New PR
          </button>
        )}
      </div>

      {/* Sub-Navigation Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-full border border-stone-200/80 w-fit mb-6 shadow-2xs">
        <button
          onClick={() => setActiveTab("PR")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            activeTab === "PR"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Purchase Requests
        </button>
        <button
          onClick={() => setActiveTab("PO")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            activeTab === "PO"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab("Supplier")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            activeTab === "Supplier"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Suppliers
        </button>
      </div>

      {loading && <div className="p-8 text-slate-500 animate-pulse">Loading procurement data...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>}
      {actionError && (
        <div role="alert" aria-live="assertive" className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500 flex items-start justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="ml-4 text-red-500 hover:text-red-800 font-bold leading-none shrink-0" aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* PR table */}
      {!loading && !error && activeTab === "PR" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>PR ID</Th>
                <Th>Date</Th>
                <Th>Requester</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr><Td colSpan={6} className="text-center py-8 text-slate-500 italic">No Purchase Requests found.</Td></tr>
              ) : prs.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{pr.id.substring(0, 8)}…</Td>
                  <Td className="text-slate-700">{new Date(pr.request_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{pr.requester_name}</Td>
                  <Td className="text-xs text-slate-600">
                    {pr.items && pr.items.length > 0 ? (
                      <ul className="list-disc pl-3 space-y-0.5 max-h-32 overflow-y-auto">
                        {pr.items.map((it: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-medium text-slate-700">{it.material_name}</span>
                            <span className="text-slate-400 ml-1">({it.quantity} {it.unit})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>{getStatusBadge(pr.status)}</Td>
                  <Td className="text-right space-x-2">
                    {pr.status === "Pending" && (user?.role === "Admin" || user?.role === "Manager") && (
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => handleApprovePR(pr.id, "Approved")} variant="primary" className="py-1 px-3 text-xs">Approve</Button>
                        <Button onClick={() => handleApprovePR(pr.id, "Rejected")} variant="danger" className="py-1 px-3 text-xs">Reject</Button>
                      </div>
                    )}
                    {pr.status === "Approved" && (user?.role === "Admin" || user?.role === "Manager" || user?.role === "Purchasing") && (
                      <div className="flex justify-end">
                        <Button onClick={() => openCreatePO(pr)} variant="primary" className="py-1 px-3 text-xs">
                          Create PO
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* PO table */}
      {!loading && !error && activeTab === "PO" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>PO ID</Th>
                <Th>Issue Date</Th>
                <Th>Supplier</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 ? (
                <tr><Td colSpan={6} className="text-center py-8 text-slate-500 italic">No Purchase Orders found.</Td></tr>
              ) : pos.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{po.id.substring(0, 8)}…</Td>
                  <Td className="text-slate-700">{new Date(po.issue_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{po.supplier_name}</Td>
                  <Td className="text-xs text-slate-600">
                    {po.items && po.items.length > 0 ? (
                      <ul className="list-disc pl-3 space-y-0.5 max-h-32 overflow-y-auto">
                        {po.items.map((it: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-medium text-slate-700">{it.material_name}</span>
                            <span className="text-slate-400 ml-1">({it.quantity} {it.unit} @ ${it.unit_price})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>{getStatusBadge(po.status)}</Td>
                  <Td className="text-right space-x-2">
                    {po.status === "Issued" && (user?.role === "Admin" || user?.role === "Manager" || user?.role === "Warehouse") && (
                      <Button onClick={() => openReceivePO(po)} variant="secondary" className="py-1 px-3 text-xs">
                        Receive Goods
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Suppliers table */}
      {!loading && !error && activeTab === "Supplier" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Contact Info</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><Td colSpan={3} className="text-center py-8 text-slate-500 italic">No suppliers found.</Td></tr>
              ) : suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-medium text-slate-900">{sup.name}</Td>
                  <Td className="text-slate-600">{sup.contact_info}</Td>
                  <Td>
                    <Badge variant={sup.is_active ? "success" : "default"}>{sup.is_active ? "Active" : "Inactive"}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ── Create Purchase Request Modal ──────────────────────────────────── */}
      {showCreatePR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-xl flex flex-col border border-slate-200 rounded-sm max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h3 className="font-semibold text-slate-900 tracking-tight">New Purchase Request</h3>
              <button
                onClick={closeCreatePR}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-500 mb-5">
                Add the materials you need to request. Each item requires a material and a positive quantity.
                The request will be submitted with <strong>Pending</strong> status for manager approval.
              </p>

              <form id="create-pr-form" onSubmit={handleCreatePR} className="space-y-4">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_120px_32px] gap-3 items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Material</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</span>
                  <span />
                </div>

                {prItems.map((item, index) => {
                  const selectedIds = prItems.map(it => it.material_id).filter((_, i) => i !== index);
                  return (
                    <div key={index} className="grid grid-cols-[1fr_120px_32px] gap-3 items-start">
                      {/* Material select */}
                      <div>
                        <label htmlFor={`pr-material-${index}`} className="sr-only">Material {index + 1}</label>
                        <select
                          id={`pr-material-${index}`}
                          required
                          value={item.material_id}
                          onChange={e => updatePrItem(index, "material_id", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-shadow"
                        >
                          <option value="">Select material…</option>
                          {materials.map(m => (
                            <option
                              key={m.id}
                              value={m.id}
                              disabled={selectedIds.includes(m.id)}
                            >
                              {m.name} ({m.sku}) — {m.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity input */}
                      <div>
                        <label htmlFor={`pr-qty-${index}`} className="sr-only">Quantity for item {index + 1}</label>
                        <Input
                          id={`pr-qty-${index}`}
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          placeholder="0"
                          value={item.quantity}
                          onChange={e => updatePrItem(index, "quantity", sanitizeNumberInput(e.target.value))}
                        />
                      </div>

                      {/* Remove row button */}
                      <button
                        type="button"
                        onClick={() => removePrItem(index)}
                        disabled={prItems.length === 1}
                        className="mt-0.5 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Remove item ${index + 1}`}
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Add row */}
                <button
                  type="button"
                  onClick={addPrItem}
                  className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium transition-colors mt-1"
                >
                  <Plus className="w-4 h-4" />
                  Add material
                </button>
              </form>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
              {prFormError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">
                  {prFormError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={closeCreatePR} variant="ghost" type="button">Cancel</Button>
                <Button
                  form="create-pr-form"
                  type="submit"
                  variant="primary"
                  disabled={prSubmitting}
                >
                  {prSubmitting ? "Submitting…" : "Submit Request"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Create Purchase Order Modal ──────────────────────────────────── */}
      {showCreatePO && selectedPR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-2xl flex flex-col border border-slate-200 rounded-sm max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900 tracking-tight">Create Purchase Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">Originating from PR #{selectedPR.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setShowCreatePO(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label htmlFor="po-supplier-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  id="po-supplier-select"
                  value={poSupplierId}
                  onChange={e => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-shadow"
                  required
                >
                  <option value="">Select a supplier…</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id} disabled={!sup.is_active}>
                      {sup.name} {!sup.is_active ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Line Items & Unit Prices
                </label>
                <div className="border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price ($)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poItems.map((item, idx) => {
                        const subtotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                        return (
                          <tr key={item.material_id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {item.material_name}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right w-36">
                              <Input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.unit_price}
                                onChange={e => {
                                  const val = sanitizeNumberInput(e.target.value);
                                  setPoItems(prev => prev.map((p, i) => i === idx ? { ...p, unit_price: val } : p));
                                }}
                                className="text-right py-1 px-2 text-sm font-mono"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                              ${subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/75 border-t border-slate-200 font-medium">
                        <td colSpan={3} className="py-2.5 px-3 text-right text-xs uppercase tracking-wider text-slate-600">Total:</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${poItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
              {poFormError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">
                  {poFormError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowCreatePO(false)} variant="ghost" type="button">Cancel</Button>
                <Button
                  onClick={handleCreatePOSubmit}
                  type="button"
                  variant="primary"
                  disabled={poSubmitting}
                >
                  {poSubmitting ? "Issuing PO…" : "Issue Purchase Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Receive Goods Modal ────────────────────────────────────────────── */}
      {showReceivePO && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-2xl flex flex-col border border-slate-200 rounded-sm max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900 tracking-tight">Receive Goods against PO</h3>
                <p className="text-xs text-slate-500 mt-0.5">Purchase Order #{selectedPO.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setShowReceivePO(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-slate-600">
                Verify the delivered quantities and confirm receipt. Stock balances will be automatically updated upon submission.
              </p>

              <div className="border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                      <th className="py-2.5 px-3 text-right">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grItems.map((item, idx) => (
                      <tr key={item.po_item_id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {item.material_name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                          {item.ordered_quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right w-40">
                          <div className="flex items-center justify-end gap-1.5">
                            <Input
                              type="number"
                              min="0.001"
                              max={item.ordered_quantity}
                              step="any"
                              required
                              value={item.received_quantity}
                              onChange={e => {
                                const val = sanitizeNumberInput(e.target.value);
                                setGrItems(prev => prev.map((g, i) => i === idx ? { ...g, received_quantity: val } : g));
                              }}
                              className="text-right py-1 px-2 text-sm font-mono w-28"
                            />
                            <span className="text-xs text-slate-500 font-mono">{item.unit}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
              {grFormError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">
                  {grFormError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowReceivePO(false)} variant="ghost" type="button">Cancel</Button>
                <Button
                  onClick={handleReceivePOSubmit}
                  type="button"
                  variant="primary"
                  disabled={grSubmitting}
                >
                  {grSubmitting ? "Receiving Goods…" : "Confirm Goods Receipt"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
