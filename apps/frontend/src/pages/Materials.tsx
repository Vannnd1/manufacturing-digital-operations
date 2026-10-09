import { useEffect, useState } from "react";
import { getMaterials, createMaterial, updateMaterial } from "../api/inventory";
import { Plus, X, Edit, Search } from "lucide-react";

export function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ sku: "", name: "", unit: "kg", min_stock_threshold: 0, is_active: true });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await getMaterials(true);
      setMaterials(data);
    } catch (err) {
      setError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

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
      fetchMaterials();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save material");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading materials...</div>;
  if (error) return <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Material Master</h2>
        <button onClick={() => openForm()} className="bg-slate-900 text-white px-3 py-1.5 text-sm rounded-sm flex items-center hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1" /> New Material
        </button>
      </div>

      <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-sm w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search materials..." 
          className="bg-transparent border-none focus:outline-none text-sm w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Min Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMaterials.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No materials found.</td></tr>
            ) : (
              filteredMaterials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{m.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                  <td className="px-4 py-3 text-slate-600">{m.min_stock_threshold}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openForm(m)} className="text-slate-400 hover:text-slate-900">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-md flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">{editingId ? 'Edit Material' : 'New Material'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {formError && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">{formError}</div>}
              <form id="material-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">SKU</label>
                  <input required disabled={!!editingId} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm disabled:bg-slate-100" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Name</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Unit</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Min Stock Threshold</label>
                  <input required type="number" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={formData.min_stock_threshold} onChange={e => setFormData({...formData, min_stock_threshold: Number(e.target.value)})} />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="is_active" className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <label htmlFor="is_active" className="ml-2 text-sm text-slate-900">Active</label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setIsFormOpen(false)} type="button" className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">Cancel</button>
              <button form="material-form" type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-sm disabled:opacity-70">
                {formLoading ? 'Saving...' : 'Save Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
