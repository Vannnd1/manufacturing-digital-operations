import { useEffect, useState, useCallback } from "react";
import { getSuppliers, getPRs, approvePR, getPOs, createPR } from "../api/procurement";
import { getMaterials } from "../api/inventory";
import { useAuthStore } from "../store/useAuthStore";
import { PageHeader, Card, Table, Th, Td, Button, Badge, Input } from "../components/ui";
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

  // ── Fetch materials once (needed by the form) ──
  useEffect(() => {
    getMaterials()
      .then((data: Material[]) => setMaterials(data))
      .catch(() => { /* non-critical — form will show empty dropdown */ });
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

  // ── Status badges ────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":  return <Badge variant="success">Approved</Badge>;
      case "Pending":   return <Badge variant="warning">Pending</Badge>;
      case "Rejected":  return <Badge variant="error">Rejected</Badge>;
      case "Fulfilled": return <Badge variant="info">Fulfilled</Badge>;
      default:          return <Badge variant="default">{status}</Badge>;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header with Create PR action */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Procurement Management"
          description="Manage purchase requests, purchase orders, and supplier information."
        />
        {activeTab === "PR" && (
          <Button onClick={openCreatePR} variant="primary" className="shrink-0 ml-4">
            <Plus className="w-4 h-4 mr-1.5" />
            New PR
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("PR")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "PR" ? "border-amber-500 text-slate-900 bg-slate-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30"}`}
        >
          Purchase Requests
        </button>
        <button
          onClick={() => setActiveTab("PO")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "PO" ? "border-amber-500 text-slate-900 bg-slate-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30"}`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab("Supplier")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "Supplier" ? "border-amber-500 text-slate-900 bg-slate-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30"}`}
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
                  <Td className="text-sm text-slate-600 max-w-xs truncate" title={pr.items?.map((it: any) => `${it.material_name} (${it.quantity}${it.unit})`).join(', ')}>
                    {pr.items?.map((it: any) => `${it.material_name} (${it.quantity}${it.unit})`).join(', ') || '-'}
                  </Td>
                  <Td>{getStatusBadge(pr.status)}</Td>
                  <Td className="text-right space-x-2">
                    {pr.status === "Pending" && (user?.role === "Admin" || user?.role === "Manager") && (
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => handleApprovePR(pr.id, "Approved")} variant="primary" className="py-1 px-3 text-xs">Approve</Button>
                        <Button onClick={() => handleApprovePR(pr.id, "Rejected")} variant="danger" className="py-1 px-3 text-xs">Reject</Button>
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
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 ? (
                <tr><Td colSpan={4} className="text-center py-8 text-slate-500 italic">No Purchase Orders found.</Td></tr>
              ) : pos.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{po.id.substring(0, 8)}…</Td>
                  <Td className="text-slate-700">{new Date(po.issue_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{po.supplier_name}</Td>
                  <Td><Badge variant="info">{po.status}</Badge></Td>
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
                          onChange={e => updatePrItem(index, "quantity", e.target.value)}
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
    </div>
  );
}
