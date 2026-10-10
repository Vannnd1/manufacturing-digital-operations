import { useEffect, useState } from "react";
import { getInventory, adjustInventory } from "../api/inventory";
import { Search, AlertTriangle, X, PackagePlus } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, Badge } from "../components/ui";

export function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [txData, setTxData] = useState({ quantity_change: 1, type: "Receipt", reference_id: "" });
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

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading inventory records...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title="Inventory Management" 
        description="Monitor warehouse stock levels and record manual receipts." 
      />

      <Card>
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center">
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
          <Button 
            variant={filterLowStock ? "accent" : "secondary"}
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="w-full sm:w-auto"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Low Stock Only
          </Button>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Material</Th>
              <Th className="text-right">Available Stock</Th>
              <Th className="text-right">Reserved</Th>
              <Th className="text-right">Min Threshold</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><Td colSpan={7} className="text-center py-8 text-slate-500 italic">No inventory records found.</Td></tr>
            ) : (
              filtered.map(m => (
                <tr key={m.material_id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs font-semibold text-slate-600">{m.sku}</Td>
                  <Td className="font-medium text-slate-900">{m.name}</Td>
                  <Td className="text-right">
                    <span className="font-bold text-slate-900">{m.available_stock}</span> 
                    <span className="text-slate-500 ml-1 text-xs">{m.unit}</span>
                  </Td>
                  <Td className="text-right text-slate-500">{m.reserved_stock}</Td>
                  <Td className="text-right text-slate-400">{m.min_stock_threshold}</Td>
                  <Td>
                    {m.status === "Low Stock" ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Healthy</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Button onClick={() => openAdjustForm(m, "Receipt")} variant="secondary" className="px-2.5 py-1 text-xs">
                      <PackagePlus className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Receive
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {isFormOpen && selectedMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-md flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">Manual Receipt: {selectedMaterial.name}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{formError}</div>}
              
              <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-sm text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 font-medium">Current Stock:</span> 
                  <span className="font-bold text-slate-900">{selectedMaterial.available_stock} {selectedMaterial.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Min Threshold:</span> 
                  <span className="text-slate-600">{selectedMaterial.min_stock_threshold} {selectedMaterial.unit}</span>
                </div>
              </div>
              
              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tx-qty">Quantity to Receive ({selectedMaterial.unit})</Label>
                  <Input id="tx-qty" required type="number" min="0.01" step="0.01" value={txData.quantity_change} onChange={e => setTxData({...txData, quantity_change: Number(e.target.value)})} />
                </div>
                <div>
                  <Label htmlFor="tx-ref">Reference ID (Optional)</Label>
                  <Input id="tx-ref" type="text" placeholder="e.g. Manual count doc" value={txData.reference_id} onChange={e => setTxData({...txData, reference_id: e.target.value})} />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-end space-x-3 bg-slate-50/50">
              <Button onClick={() => setIsFormOpen(false)} type="button" variant="ghost">Cancel</Button>
              <Button form="tx-form" type="submit" variant="primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Confirm Receipt'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
