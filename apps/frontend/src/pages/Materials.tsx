import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMaterials, createMaterial, updateMaterial } from "../api/inventory";
import { Plus, Search, Edit, X, AlertTriangle, Layers, PackagePlus } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Input, Label, Badge } from "../components/ui";
import { sanitizeNumberInput } from "../utils/number";
import { UnitSelect } from "../components/UnitSelect";
import { isCanonicalUnit } from "../constants/uom";

export function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalUnit, setOriginalUnit] = useState<string>("");
  const [formData, setFormData] = useState<{ sku: string; name: string; unit: string; min_stock_threshold: string | number; is_active: boolean }>({
    sku: "",
    name: "",
    unit: "kg",
    min_stock_threshold: "",
    is_active: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const data = await getMaterials(showInactive);
        setMaterials(data);
      } catch {
        setError("Failed to load materials");
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [refresh, showInactive]);

  const openForm = (material?: any) => {
    if (material) {
      setEditingId(material.id);
      setOriginalUnit(material.unit);
      setFormData({ sku: material.sku, name: material.name, unit: material.unit, min_stock_threshold: material.min_stock_threshold, is_active: material.is_active });
    } else {
      setEditingId(null);
      setOriginalUnit("");
      setFormData({ sku: "", name: "", unit: "kg", min_stock_threshold: "", is_active: true });
    }
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!formData.unit || !formData.unit.trim()) {
      setFormError("Unit of measure is required.");
      setFormLoading(false);
      return;
    }

    if (!editingId && !isCanonicalUnit(formData.unit)) {
      setFormError("Please select a standard unit of measure from the catalog.");
      setFormLoading(false);
      return;
    }

    try {
      if (editingId) {
        await updateMaterial(editingId, { ...formData, min_stock_threshold: Number(formData.min_stock_threshold) });
      } else {
        await createMaterial({ ...formData, min_stock_threshold: Number(formData.min_stock_threshold) });
      }
      setIsFormOpen(false);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save material");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading material master data...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Domain Sub-Page Tabs: Stock & Materials ── */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-full border border-stone-200/80 w-fit shadow-2xs">
        <Link
          to="/inventory"
          className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/60 transition-colors flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Inventory Stock</span>
        </Link>
        <Link
          to="/materials"
          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs flex items-center gap-1.5"
        >
          <PackagePlus className="w-3.5 h-3.5 text-amber-400" />
          <span>Material Master</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full font-mono">{materials.length}</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Material Master" 
          description="Manage raw materials, components, and tracking thresholds." 
        />
        <button 
          onClick={() => openForm()} 
          className="mb-6 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> New Material
        </button>
      </div>

      <Card className="rounded-2xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by SKU or material name..." 
              className="w-full pl-9 pr-4 py-2 rounded-full border border-stone-200/80 bg-white text-xs text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="toggle-inactive" 
              className="w-4 h-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
            />
            <label htmlFor="toggle-inactive" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer">
              Show Inactive
            </label>
          </div>
        </div>
        
        <Table>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Name</Th>
              <Th>Unit</Th>
              <Th className="text-right">Min Stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr><Td colSpan={6} className="text-center py-8 text-slate-500 italic">No materials found.</Td></tr>
            ) : (
              filteredMaterials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs font-semibold text-slate-600">{m.sku}</Td>
                  <Td className="font-medium text-slate-900">{m.name}</Td>
                  <Td className="text-slate-500">{m.unit}</Td>
                  <Td className="text-right font-medium">{m.min_stock_threshold}</Td>
                  <Td>
                    <Badge variant={m.is_active ? 'success' : 'default'}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => openForm(m)} className="text-slate-400 hover:text-amber-600 transition-colors p-1" title="Edit Material">
                      <Edit className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col border border-stone-200/90 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{editingId ? 'Edit Material' : 'New Material'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-stone-400 hover:text-slate-900 transition-colors p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {formError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">{formError}</div>
              )}
              <form id="material-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mat-sku">SKU</Label>
                  <Input id="mat-sku" required disabled={!!editingId} type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className={editingId ? "bg-slate-100 text-slate-500 rounded-xl" : "rounded-xl"} />
                </div>
                <div>
                  <Label htmlFor="mat-name">Material Name</Label>
                  <Input id="mat-name" required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="mat-unit">Unit of Measure (UOM)</Label>
                  <UnitSelect
                    id="mat-unit"
                    required
                    value={formData.unit}
                    onChange={u => setFormData({ ...formData, unit: u })}
                  />
                  {editingId && originalUnit && formData.unit !== originalUnit && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-semibold">Unit modification warning:</span> Existing inventory balances and order history will not be converted numerically. Quantities previously recorded in <strong>{originalUnit}</strong> will now be treated as <strong>{formData.unit}</strong>.
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="mat-threshold">Minimum Stock Threshold</Label>
                  <Input
                    id="mat-threshold"
                    required
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.min_stock_threshold}
                    onChange={e => setFormData({...formData, min_stock_threshold: sanitizeNumberInput(e.target.value)})}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active" className="w-4 h-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <label htmlFor="is_active" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer">Active Material</label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-stone-100 flex justify-end space-x-2.5 bg-stone-50/50">
              <button 
                onClick={() => setIsFormOpen(false)} 
                type="button" 
                className="px-4 py-2 rounded-full border border-stone-200 text-slate-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                form="material-form" 
                type="submit" 
                disabled={formLoading}
                className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Save Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
