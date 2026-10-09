import { useEffect, useState } from "react";
import { getSuppliers, getPRs, approvePR, getPOs } from "../api/procurement";
import { useAuthStore } from "../store/useAuthStore";
import { PageHeader, Card, Table, Th, Td, Button, Badge } from "../components/ui";

export function Procurement() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"PR" | "PO" | "Supplier">("PR");
  
  const [prs, setPrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
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
    try {
      await approvePR(id, status);
      setRefresh(r => r + 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update PR");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Pending': return <Badge variant="warning">Pending</Badge>;
      case 'Rejected': return <Badge variant="error">Rejected</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title="Procurement Management" 
        description="Manage purchase requests, purchase orders, and supplier information." 
      />

      <div className="flex space-x-1 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab("PR")} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PR' ? 'border-amber-500 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'}`}
        >
          Purchase Requests
        </button>
        <button 
          onClick={() => setActiveTab("PO")} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PO' ? 'border-amber-500 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'}`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab("Supplier")} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Supplier' ? 'border-amber-500 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'}`}
        >
          Suppliers
        </button>
      </div>

      {loading && <div className="p-8 text-slate-500 animate-pulse">Loading procurement data...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>}

      {!loading && !error && activeTab === "PR" && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>PR ID</Th>
                <Th>Date</Th>
                <Th>Requester</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr><Td colSpan={5} className="text-center py-8 text-slate-500 italic">No Purchase Requests found.</Td></tr>
              ) : prs.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-mono text-xs text-slate-500 font-medium">{pr.id}</Td>
                  <Td className="text-slate-700">{new Date(pr.request_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{pr.requester_name}</Td>
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
                  <Td className="font-mono text-xs text-slate-500 font-medium">{po.id}</Td>
                  <Td className="text-slate-700">{new Date(po.issue_date).toLocaleDateString()}</Td>
                  <Td className="font-medium text-slate-900">{po.supplier_name}</Td>
                  <Td><Badge variant="info">{po.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

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
                    <Badge variant={sup.is_active ? 'success' : 'default'}>{sup.is_active ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
