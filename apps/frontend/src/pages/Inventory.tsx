import { useEffect, useState } from "react";
import { getInventory, adjustInventory } from "../api/inventory";
import { Search, AlertTriangle, X } from "lucide-react";

export function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [txData, setTxData] = useState({ quantity_change: 0, type: "Receipt", reference_id: "" });
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
    setSelectedMaterial(item);
    setTxData({ quantity_change: 1, type, reference_id: "" });
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

  const filtered = inventory.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = filterLowStock ? m.status === "Low Stock" : true;
    return matchesSearch && matchesLowStock;
  });

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading inventory...</div>;
  if (error) return <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Inventory Management</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-sm w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-3 py-2 text-sm rounded-sm border ${filterLowStock ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-700'} hover:bg-slate-50 flex items-center transition-colors`}
        >
          <AlertTriangle className={`w-4 h-4 mr-2 ${filterLowStock ? 'text-amber-600' : 'text-slate-400'}`} />
          Low Stock Only
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Material</th>
              <th className="px-4 py-3 font-medium text-right">Available Stock</th>
              <th className="px-4 py-3 font-medium text-right">Reserved</th>
              <th className="px-4 py-3 font-medium text-right">Min Threshold</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No inventory records found.</td></tr>
            ) : (
              filtered.map(m => (
                <tr key={m.material_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{m.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{m.available_stock} <span className="text-slate-500 text-xs font-normal">{m.unit}</span></td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.reserved_stock}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.min_stock_threshold}</td>
                  <td className="px-4 py-3">
                    {m.status === "Low Stock" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Low Stock</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">Healthy</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openAdjustForm(m, "Receipt")} className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-sm text-xs border border-slate-200" title="Receive Stock">
                      + Receive
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && selectedMaterial && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-sm flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Manual Receipt: {selectedMaterial.name}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {formError && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">{formError}</div>}
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm">
                <div className="flex justify-between mb-1"><span className="text-slate-500">Current Stock:</span> <span className="font-medium text-slate-900">{selectedMaterial.available_stock} {selectedMaterial.unit}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Min Threshold:</span> <span className="text-slate-900">{selectedMaterial.min_stock_threshold} {selectedMaterial.unit}</span></div>
              </div>
              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Quantity to Receive ({selectedMaterial.unit})</label>
                  <input required type="number" min="0.01" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={txData.quantity_change} onChange={e => setTxData({...txData, quantity_change: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Reference ID (Optional)</label>
                  <input type="text" placeholder="e.g. Manual count doc" className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm" value={txData.reference_id} onChange={e => setTxData({...txData, reference_id: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setIsFormOpen(false)} type="button" className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">Cancel</button>
              <button form="tx-form" type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-sm disabled:opacity-70">
                {formLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
