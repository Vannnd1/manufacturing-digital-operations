import { useEffect, useState } from "react";
import { getMaterials, createMaterial, updateMaterial } from "../api/inventory";
import { Plus, Search, Edit, X } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, Badge } from "../components/ui";

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
  const [formData, setFormData] = useState({ sku: "", name: "", unit: "kg", min_stock_threshold: 0, is_active: true });
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
      setFormData({ sku: material.sku, name: material.name, unit: material.unit, min_stock_threshold: material.min_stock_threshold, is_active: material.is_active });
    } else {
      setEditingId(null);
      setFormData({ sku: "", name: "", unit: "kg", min_stock_threshold: 0, is_active: true });
    }
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Material Master" 
          description="Manage raw materials, components, and tracking thresholds." 
        />
        <Button onClick={() => openForm()} variant="primary" className="mb-6">
          <Plus className="w-4 h-4 mr-2" /> New Material
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search by SKU or material name..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="toggle-inactive" 
              className="w-4 h-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
            />
            <label htmlFor="toggle-inactive" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-md flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">{editingId ? 'Edit Material' : 'New Material'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {formError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{formError}</div>
              )}
              <form id="material-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="mat-sku">SKU</Label>
                  <Input id="mat-sku" required disabled={!!editingId} type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className={editingId ? "bg-slate-100 text-slate-500" : ""} />
                </div>
                <div>
                  <Label htmlFor="mat-name">Material Name</Label>
                  <Input id="mat-name" required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="mat-unit">Unit of Measure</Label>
                  <Input id="mat-unit" required type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="e.g. kg, pcs, liters" />
                </div>
                <div>
                  <Label htmlFor="mat-threshold">Minimum Stock Threshold</Label>
                  <Input id="mat-threshold" required type="number" min="0" value={formData.min_stock_threshold} onChange={e => setFormData({...formData, min_stock_threshold: Number(e.target.value)})} />
                </div>
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active" className="w-4 h-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">Active Material</label>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-end space-x-3 bg-slate-50/50">
              <Button onClick={() => setIsFormOpen(false)} type="button" variant="ghost">Cancel</Button>
              <Button form="material-form" type="submit" variant="primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Material'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
