import { useEffect, useState } from "react";
import { getInspections, getPendingInspections, getInspectionDetails, createInspection } from "../api/quality";
import { X } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label } from "../components/ui";

export function Quality() {
  const [activeTab, setActiveTab] = useState<"Pending" | "Inspections">("Pending");
  
  const [pending, setPending] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [activeModal, setActiveModal] = useState<"inspect" | "details" | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);

  // Form states
  const [passQty, setPassQty] = useState(0);
  const [failQty, setFailQty] = useState(0);
  const [defectReason, setDefectReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "Inspections") setInspections(await getInspections());
        if (activeTab === "Pending") setPending(await getPendingInspections());
      } catch {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, refresh]);

  const openInspect = (record: any) => {
    setSelectedRecord(record);
    setPassQty(Number(record.actual_quantity_produced));
    setFailQty(0);
    setDefectReason("");
    setFormError("");
    setActiveModal("inspect");
  };

  const openDetails = async (inspection: any) => {
    setActiveModal("details");
    setDetails(null);
    setDetailsError("");
    try {
      setDetails(await getInspectionDetails(inspection.id));
    } catch {
      setDetailsError("Failed to load inspection details. Please try again.");
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const payload: any = {
        production_record_id: selectedRecord.id,
        pass_quantity: passQty,
        fail_quantity: failQty,
      };
      if (failQty > 0) {
        payload.defects = [{ defect_reason: defectReason, quantity: failQty }];
      }
      await createInspection(payload);
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create inspection record. Please try again.");
    }
    setFormLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title="Quality Control" 
        description="Inspect production output, record defects, and manage finished goods." 
      />

      <div className="flex space-x-1 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab("Pending")} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Pending' ? 'border-amber-500 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'}`}
        >
          Pending Inspections
        </button>
        <button 
          onClick={() => setActiveTab("Inspections")} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Inspections' ? 'border-amber-500 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'}`}
        >
          Inspection Records
        </button>
      </div>

      {loading && <div className="p-8 text-slate-500 animate-pulse">Loading quality control data...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>}

      {!loading && !error && activeTab === "Pending" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Record ID</Th>
                <Th>Product</Th>
                <Th>Date</Th>
                <Th className="text-right">Produced Qty</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><Td colSpan={5} className="text-center py-8 text-slate-500 italic">No pending inspections.</Td></tr>
              ) : pending.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{record.id}</Td>
                  <Td>
                    <div className="font-medium text-slate-900">{record.product_name}</div>
                    <div className="font-mono text-xs text-slate-500 mt-0.5">{record.product_sku}</div>
                  </Td>
                  <Td className="text-slate-700">{new Date(record.completion_date).toLocaleDateString()}</Td>
                  <Td className="text-right font-semibold">{record.actual_quantity_produced}</Td>
                  <Td className="text-right">
                    <Button onClick={() => openInspect(record)} variant="primary" className="py-1 px-3 text-xs">
                      Inspect
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {!loading && !error && activeTab === "Inspections" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Inspection ID</Th>
                <Th>Prodo ID</Th>
                <Th>Date</Th>
                <Th>Inspector</Th>
                <Th className="text-right">Pass Qty</Th>
                <Th className="text-right">Fail Qty</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {inspections.length === 0 ? (
                <tr><Td colSpan={7} className="text-center py-8 text-slate-500 italic">No inspection records found.</Td></tr>
              ) : inspections.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{i.id}</Td>
                  <Td className="font-mono text-xs text-slate-500 font-medium">{i.prodo_id.substring(0,8)}...</Td>
                  <Td className="text-slate-700">{new Date(i.inspection_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{i.inspector_name}</Td>
                  <Td className="text-right font-semibold text-emerald-600">{i.pass_quantity}</Td>
                  <Td className="text-right font-semibold text-red-600">{i.fail_quantity}</Td>
                  <Td className="text-right">
                    <Button onClick={() => openDetails(i)} variant="secondary" className="py-1 px-3 text-xs">
                      View
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Inspect Modal */}
      {activeModal === "inspect" && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-sm flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">Record Inspection</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5 text-sm text-slate-700 bg-slate-50 p-3 rounded-sm border border-slate-200">
                Product: <span className="font-bold text-slate-900">{selectedRecord.product_name}</span><br />
                Total Produced: <span className="font-bold text-slate-900">{selectedRecord.actual_quantity_produced}</span>
              </div>
              <form id="inspect-form" onSubmit={handleInspectSubmit} className="space-y-5">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label>Pass Qty</Label>
                    <Input required type="number" min="0" step="0.01" 
                      className="border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={passQty} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setPassQty(val);
                        setFailQty(Number(selectedRecord.actual_quantity_produced) - val);
                      }} />
                  </div>
                  <div className="flex-1">
                    <Label>Fail Qty</Label>
                    <Input required type="number" min="0" step="0.01" 
                      className="border-red-200 focus:ring-red-500/20 focus:border-red-500"
                      value={failQty} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFailQty(val);
                        setPassQty(Number(selectedRecord.actual_quantity_produced) - val);
                      }} />
                  </div>
                </div>
                {failQty > 0 && (
                  <div>
                    <Label>Defect Reason</Label>
                    <select required className="w-full px-3 py-2 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow rounded-sm" value={defectReason} onChange={e => setDefectReason(e.target.value)}>
                      <option value="">Select reason...</option>
                      <option value="Scratch/Cosmetic">Scratch/Cosmetic</option>
                      <option value="Assembly Error">Assembly Error</option>
                      <option value="Material Failure">Material Failure</option>
                      <option value="Dimensional Out of Spec">Dimensional Out of Spec</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3">
              {formError && (
                <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{formError}</div>
              )}
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setActiveModal(null)} variant="ghost">Cancel</Button>
                <Button form="inspect-form" type="submit" variant="primary" disabled={formLoading || Math.abs(Number(passQty) + Number(failQty) - Number(selectedRecord.actual_quantity_produced)) > 0.001}>
                  {formLoading ? 'Saving...' : 'Submit Inspection'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {activeModal === "details" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl w-full max-w-md flex flex-col border border-slate-200 rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 tracking-tight">Inspection Details</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {detailsError ? (
                <div role="alert" aria-live="assertive" className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{detailsError}</div>
              ) : !details ? (
                <div className="text-sm text-slate-500 animate-pulse py-8 text-center">Loading details...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Inspector</p>
                      <p className="font-medium text-slate-900">{details.inspector_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Date</p>
                      <p className="font-medium text-slate-900">{new Date(details.inspection_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Pass Qty</p>
                      <p className="font-bold text-emerald-600 text-lg">{details.pass_quantity}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Fail Qty</p>
                      <p className="font-bold text-red-600 text-lg">{details.fail_quantity}</p>
                    </div>
                  </div>

                  {details.defects && details.defects.length > 0 && (
                    <div className="mt-6 border-t border-slate-200 pt-5">
                      <h4 className="font-semibold text-slate-900 text-sm mb-3">Defect Records</h4>
                      <div className="border border-slate-200 rounded-sm overflow-hidden">
                        <Table>
                          <thead>
                            <tr>
                              <Th>Reason</Th>
                              <Th className="text-right">Qty</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.defects.map((d: any) => (
                              <tr key={d.id} className="hover:bg-slate-50/50">
                                <Td className="font-medium">{d.defect_reason}</Td>
                                <Td className="text-right font-semibold text-red-600">{d.quantity}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {details.finished_goods && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-sm text-sm">
                      <p className="text-emerald-800">
                        <span className="font-bold">{details.finished_goods.quantity}</span> items successfully recorded to Finished Goods inventory.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50/50">
              <Button onClick={() => setActiveModal(null)} variant="secondary">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
