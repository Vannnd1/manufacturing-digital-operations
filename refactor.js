const fs = require('fs');

function refactorFile(file, functionName, dependencies = 'refresh', fetchContent) {
  const path = 'apps/frontend/src/pages/' + file;
  let code = fs.readFileSync(path, 'utf8');

  // Remove useCallback from imports
  code = code.replace(/,\s*useCallback/g, '');

  // Add refresh state if needed
  if (dependencies === 'refresh') {
    if (!code.includes('const [refresh, setRefresh] = useState(0);')) {
      code = code.replace('const [error, setError] = useState("");', 'const [error, setError] = useState("");\n  const [refresh, setRefresh] = useState(0);');
    }
  }

  // Remove the old useCallback function and the useEffect
  // We'll use a regex to strip them out and insert the new useEffect
  const regex = new RegExp(`const ${functionName} = useCallback\\(async \\(\\) => \\{[\\s\\S]*?\\}, \\[[^\\]]*\\]\\);\\s*useEffect\\(\\(\\) => \\{\\s*${functionName}\\(\\);\\s*\\}, \\[[^\\]]*\\]\\);`, 'g');
  
  const newUseEffect = `useEffect(() => {
    const ${functionName} = async () => {
${fetchContent}
    };
    ${functionName}();
  }, [${dependencies}]);`;

  code = code.replace(regex, newUseEffect);

  // Replace manual calls to the fetch function with setRefresh
  if (dependencies === 'refresh') {
    code = code.replace(new RegExp(`\\b${functionName}\\(\\);(?![\\s\\S]*${functionName}\\(\\);)`, 'g'), 'setRefresh(r => r + 1);');
  }

  fs.writeFileSync(path, code);
}

// Inventory
refactorFile('Inventory.tsx', 'fetchInventory', 'refresh', 
`      try {
        setLoading(true);
        const data = await getInventory();
        setInventory(data);
      } catch {
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }`);

// Materials
refactorFile('Materials.tsx', 'fetchMaterials', 'refresh', 
`      try {
        setLoading(true);
        const data = await getMaterials(true);
        setMaterials(data);
      } catch {
        setError("Failed to load materials");
      } finally {
        setLoading(false);
      }`);

// Production
refactorFile('Production.tsx', 'fetchOrders', 'refresh', 
`      try {
        setLoading(true);
        setOrders(await getProductionOrders());
      } catch {
        setError("Failed to load production orders");
      } finally {
        setLoading(false);
      }`);

// Procurement (already has activeTab, doesn't need refresh for tab switches, but for approve PR it does)
// Wait, if it has activeTab, we can just use activeTab AND refresh!
function refactorProcurement() {
  const path = 'apps/frontend/src/pages/Procurement.tsx';
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/,\s*useCallback/g, '');
  if (!code.includes('const [refresh, setRefresh] = useState(0);')) {
    code = code.replace('const [error, setError] = useState("");', 'const [error, setError] = useState("");\n  const [refresh, setRefresh] = useState(0);');
  }
  
  const oldCode = /const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[activeTab\]\);\s*useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[fetchData\]\);/;
  const newCode = `useEffect(() => {
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
  }, [activeTab, refresh]);`;
  
  code = code.replace(oldCode, newCode);
  code = code.replace(/fetchData\(\);/g, 'setRefresh(r => r + 1);');
  
  fs.writeFileSync(path, code);
}
refactorProcurement();

// Quality (same, activeTab + refresh)
function refactorQuality() {
  const path = 'apps/frontend/src/pages/Quality.tsx';
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/,\s*useCallback/g, '');
  if (!code.includes('const [refresh, setRefresh] = useState(0);')) {
    code = code.replace('const [error, setError] = useState("");', 'const [error, setError] = useState("");\n  const [refresh, setRefresh] = useState(0);');
  }
  
  const oldCode = /const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[activeTab\]\);\s*useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[fetchData\]\);/;
  const newCode = `useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "Completed") setInspections(await getInspections());
        if (activeTab === "Pending") setPending(await getPendingInspections());
      } catch {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, refresh]);`;
  
  code = code.replace(oldCode, newCode);
  code = code.replace(/fetchData\(\);/g, 'setRefresh(r => r + 1);');
  
  fs.writeFileSync(path, code);
}
refactorQuality();

