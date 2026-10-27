import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInventory, adjustInventory } from "../api/inventory";
import { Search, AlertTriangle, X, PackagePlus, ArrowRight, Layers, CheckCircle2, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, Badge, StockLevelBar } from "../components/ui";
import { sanitizeNumberInput } from "../utils/number";
import { useAuthStore } from "../store/useAuthStore";

export function Inventory() {
  const { user } = useAuthStore();
  const canManageStock = Boolean(user && ["Admin", "Manager", "Warehouse"].includes(user.role));

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "healthy">("all");
  const [refresh, setRefresh] = useState(0);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [txData, setTxData] = useState<{ quantity_change: string | number; type: string; reference_id: string }>({ 
    quantity_change: "", 
    type: "Receipt", 
    reference_id: "" 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await getInventory();
        setInventory(data);
      } catch {
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [refresh]);

  const openAdjustForm = (item: any, type: "Receipt" | "Adjustment") => {
    if (!canManageStock) return;
    setSelectedMaterial(item);
    setTxData({ quantity_change: "", type, reference_id: "" });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await adjustInventory({
        material_id: selectedMaterial.material_id,
        ...txData,
        quantity_change: Number(txData.quantity_change)
      });
      setIsFormOpen(false);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record transaction");
    } finally {
      setFormLoading(false);
    }
  };

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (m) => m.status === "Low Stock" || Number(m.available_stock) < Number(m.min_stock_threshold)
  );
  const healthyItems = inventory.filter(
    (m) => m.status !== "Low Stock" && Number(m.available_stock) >= Number(m.min_stock_threshold)
  );
  const totalAvailable = inventory.reduce((sum, it) => sum + (Number(it.available_stock) || 0), 0);
  const totalReserved = inventory.reduce((sum, it) => sum + (Number(it.reserved_stock) || 0), 0);

  const filtered = inventory.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.sku.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterMode === "low") {
      return m.status === "Low Stock" || Number(m.available_stock) < Number(m.min_stock_threshold);
    }
    if (filterMode === "healthy") {
      return m.status !== "Low Stock" && Number(m.available_stock) >= Number(m.min_stock_threshold);
    }
    return true;
  });

  if (loading) return (
    <div className="p-8 text-slate-500 animate-pulse font-medium text-xs">
      Loading inventory ledger...
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
      {error}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Page Header with Actions ── */}
      <PageHeader
        title="Inventory Management"
        description="Monitor stock thresholds, warehouse ledger movements, and replenishment allocations."
        action={
          canManageStock && lowStockItems.length > 0 ? (
            <Link to="/procurement">
              <Button variant="accent" className="gap-1.5 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Procure Shortages ({lowStockItems.length})</span>
              </Button>
            </Link>
          ) : null
        }
      />

      {/* ── Domain Sub-Page Tabs: Stock & Materials ── */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 shadow-2xs w-fit">
        <Link
          to="/inventory"
          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white shadow-xs flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
          <span>Inventory Stock</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-mono">{lowStockItems.length}</span>
          )}
        </Link>
        <Link
          to="/materials"
          className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
        >
          <PackagePlus className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400" />
          <span>Material Master</span>
        </Link>
      </div>

      {/* ── Row 2: 4 Modern Metric Hero Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKUs */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tracked SKUs</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
              {totalItems}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Active bill-of-materials catalog
            </p>
          </div>
        </div>

        {/* Card 2: Below Reorder Point (Soft Peach) */}
        <div className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between h-32 transition-all ${
          lowStockItems.length > 0
            ? "bg-[#FEF5E7] border-amber-200/70 text-amber-950"
            : "bg-white border-stone-200/80 text-slate-900"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              lowStockItems.length > 0 ? "text-amber-800" : "text-slate-500"
            }`}>
              Below Reorder Point
            </span>
            <AlertTriangle className={`w-4 h-4 ${
              lowStockItems.length > 0 ? "text-amber-600" : "text-slate-400"
            }`} />
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
              lowStockItems.length > 0 ? "text-amber-900" : "text-slate-900"
            }`}>
              {lowStockItems.length}
            </div>
            <p className={`text-[11px] mt-0.5 font-medium ${
              lowStockItems.length > 0 ? "text-amber-800" : "text-slate-500"
            }`}>
              {lowStockItems.length > 0 ? "Replenishment trigger active" : "Safety thresholds intact"}
            </p>
          </div>
        </div>

        {/* Card 3: Available Physical Stock (Soft Blue) */}
        <div className="bg-[#E0EDFD] rounded-2xl p-5 border border-blue-200/60 shadow-xs flex flex-col justify-between h-32 text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Available Stock</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-blue-950">
              {totalAvailable.toLocaleString()}
            </div>
            <p className="text-[11px] text-blue-800 mt-0.5 font-medium">
              Uncommitted physical units
            </p>
          </div>
        </div>

        {/* Card 4: Allocated / Reserved (Soft Mint) */}
        <div className="bg-[#E6F7EC] rounded-2xl p-5 border border-emerald-200/60 shadow-xs flex flex-col justify-between h-32 text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Allocated / Reserved</span>
            <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-950">
              {totalReserved.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">
              Committed to active work orders
            </p>
          </div>
        </div>
      </div>

      {/* ── Critical Shortages Action Banner ── */}
      {lowStockItems.length > 0 && (
        <div className="bg-[#FEF5E7] border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Critical Shortages: {lowStockItems.length} Materials At or Below Safety Threshold
                </h3>
                <p className="text-[11px] text-amber-800">
                  Immediate purchase requisitions are required to prevent assembly line staging delays.
                </p>
              </div>
            </div>
            <Link
              to="/procurement"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-amber-300 transition-colors shrink-0"
            >
              <span>Initiate Requisition</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lowStockItems.slice(0, 3).map((item) => (
              <div 
                key={item.material_id} 
                className="p-3 bg-white/95 rounded-xl border border-amber-200 flex items-center justify-between shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] font-mono text-slate-500">{item.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-rose-600 font-mono">
                    {item.available_stock} <span className="text-[10px] font-normal text-slate-400">/ min {item.min_stock_threshold}</span>
                  </p>
                  <span className="text-[10px] text-amber-700 font-semibold uppercase">Deficit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Inventory Table & Filter Container ── */}
      <Card className="p-0 overflow-hidden bg-white border-stone-200/80">
        {/* Table Top Controls & Filter Pills */}
        <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search by SKU or material name..." 
              className="pl-9.5 rounded-full text-xs bg-white border-stone-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Segmented Pill Filter Controls */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-stone-100 p-1 rounded-full border border-stone-200/60">
            <button 
              type="button"
              onClick={() => setFilterMode("all")}
              className={`text-xs font-semibold py-1 px-3 rounded-full transition-all cursor-pointer ${
                filterMode === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Items ({totalItems})
            </button>
            <button 
              type="button"
              onClick={() => setFilterMode("low")}
              className={`text-xs font-semibold py-1 px-3 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === "low"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Low Stock ({lowStockItems.length})
            </button>
            <button 
              type="button"
              onClick={() => setFilterMode("healthy")}
              className={`text-xs font-semibold py-1 px-3 rounded-full transition-all cursor-pointer ${
                filterMode === "healthy"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Healthy ({healthyItems.length})
            </button>
          </div>
        </div>

        {/* Table Records */}
        <Table>
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-slate-600">
              <Th>SKU</Th>
              <Th>Material</Th>
              <Th className="min-w-[160px]">Stock Level vs Reorder</Th>
              <Th className="text-right">Available</Th>
              <Th className="text-right">Reserved</Th>
              <Th className="text-right">Min Threshold</Th>
              <Th>Status</Th>
              {canManageStock && <Th className="text-right">Actions</Th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={canManageStock ? 8 : 7} className="text-center py-10 text-slate-400 italic text-xs">
                  No inventory records found matching your filters.
                </Td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.material_id} className="hover:bg-stone-50/60 transition-colors">
                  <Td className="font-mono text-xs font-semibold text-slate-600">
                    {m.sku}
                  </Td>
                  <Td className="font-medium text-slate-900">
                    <div className="font-semibold text-xs text-slate-900">{m.name}</div>
                  </Td>
                  <Td>
                    <StockLevelBar 
                      current={Number(m.available_stock) || 0}
                      threshold={Number(m.min_stock_threshold) || 0}
                      unit={m.unit}
                    />
                  </Td>
                  <Td className="text-right font-mono font-bold text-xs text-slate-900">
                    <span>{m.available_stock}</span> 
                    <span className="text-slate-400 ml-1 font-normal font-sans text-[11px]">{m.unit}</span>
                  </Td>
                  <Td className="text-right font-mono text-xs text-slate-500">
                    {m.reserved_stock}
                  </Td>
                  <Td className="text-right font-mono text-xs text-slate-400">
                    {m.min_stock_threshold}
                  </Td>
                  <Td>
                    {m.status === "Low Stock" ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Healthy</Badge>
                    )}
                  </Td>
                  {canManageStock && (
                    <Td className="text-right space-x-1.5">
                      <button 
                        type="button"
                        onClick={() => openAdjustForm(m, "Receipt")} 
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        <PackagePlus className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Receive
                      </button>
                      <button 
                        type="button"
                        onClick={() => openAdjustForm(m, "Adjustment")} 
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full hover:bg-stone-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Adjust
                      </button>
                    </Td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* ── Stock Adjustment / Receipt Modal ── */}
      {isFormOpen && selectedMaterial && canManageStock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col border border-stone-200 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {txData.type === "Adjustment" ? "Stock Adjustment" : "Manual Material Receipt"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedMaterial.sku} · {selectedMaterial.name}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-stone-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}
              
              <div className="mb-5 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Available Stock:</span> 
                  <span className="font-bold font-mono text-slate-900">
                    {selectedMaterial.available_stock} {selectedMaterial.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Minimum Threshold:</span> 
                  <span className="font-mono text-slate-600">
                    {selectedMaterial.min_stock_threshold} {selectedMaterial.unit}
                  </span>
                </div>
              </div>
              
              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tx-qty" className="text-xs font-semibold text-slate-700">
                    {txData.type === "Adjustment"
                      ? `Quantity Adjustment (${selectedMaterial.unit})`
                      : `Quantity to Receive (${selectedMaterial.unit})`}
                  </Label>
                  <Input
                    id="tx-qty"
                    required
                    type="number"
                    step="any"
                    placeholder="0"
                    className="rounded-xl border-stone-300 text-xs font-mono"
                    value={txData.quantity_change}
                    onChange={e => {
                      const val = e.target.value;
                      if (txData.type === "Adjustment" && val.startsWith("-")) {
                        const rest = val.slice(1);
                        setTxData({...txData, quantity_change: "-" + sanitizeNumberInput(rest)});
                      } else {
                        setTxData({...txData, quantity_change: sanitizeNumberInput(val)});
                      }
                    }}
                  />
                  {txData.type === "Adjustment" && (
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Enter a positive value to increase stock, or a negative value (e.g. -5) for discrepancy shrinkage.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tx-ref" className="text-xs font-semibold text-slate-700">
                    Reference ID / Note (Optional)
                  </Label>
                  <Input 
                    id="tx-ref" 
                    type="text" 
                    placeholder="e.g. Physical inventory cycle count #14" 
                    className="rounded-xl border-stone-300 text-xs"
                    value={txData.reference_id} 
                    onChange={e => setTxData({...txData, reference_id: e.target.value})} 
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-stone-200 flex justify-end space-x-2.5 bg-stone-50/70">
              <Button 
                onClick={() => setIsFormOpen(false)} 
                type="button" 
                variant="ghost" 
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button 
                form="tx-form" 
                type="submit" 
                variant="primary" 
                disabled={formLoading}
                className="rounded-full text-xs font-semibold"
              >
                {formLoading ? 'Saving...' : (txData.type === "Adjustment" ? 'Confirm Adjustment' : 'Confirm Receipt')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
