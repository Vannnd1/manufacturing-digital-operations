import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Users, 
  Building2, 
  Laptop, 
  Clock, 
  Search, 
  MapPin, 
  RotateCcw,
  Check,
  List,
  LayoutGrid,
  ShieldCheck,
  Award,
  X,
  UserCheck
} from "lucide-react";
import { PageHeader, Card, Button, Input } from "../components/ui";
import { useStaffStore, type StaffMember } from "../store/useStaffStore";
import { useAuthStore } from "../store/useAuthStore";
import { usePermissionsStore } from "../store/usePermissionsStore";

export function Staff() {
  const { user } = useAuthStore();
  const canEditStaff = usePermissionsStore((state) => state.canEdit(user?.role, "Staff & Shifts"));
  const { staff, updateStatus, syncCurrentUser, resetStaff } = useStaffStore();
  const [activeTab, setActiveTab] = useState<"all" | "present" | "shift1" | "shift2" | "offfloor">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("Everyone");
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [viewingProfile, setViewingProfile] = useState<StaffMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize current logged-in user so 'st-1' reflects their real name
  useEffect(() => {
    if (user?.name) {
      syncCurrentUser(user.name, user.role);
    }
  }, [user?.name, user?.role, syncCurrentUser]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Department list
  const departments = [
    "Everyone",
    "AC Manufacturing",
    "Refrigerator Line",
    "Washing Machine Line",
    "Display & TV Line",
    "Quality Assurance",
    "Warehouse & Logistics",
    "Procurement & Sourcing",
    "Plant Operations",
    "Plant Engineering",
    "Finance",
  ];

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // Sub-tab filter
      if (activeTab === "present" && member.status !== "present") return false;
      if (activeTab === "shift1" && !member.shift.includes("Shift 1")) return false;
      if (activeTab === "shift2" && !member.shift.includes("Shift 2")) return false;
      if (activeTab === "offfloor" && member.status === "present") return false;

      // Department filter
      const matchDept = selectedDept === "Everyone" || member.department === selectedDept;

      // Search query
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchDept;

      const matchSearch =
        member.name.toLowerCase().includes(query) ||
        member.employeeId.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.workCenter.toLowerCase().includes(query) ||
        member.skills.some((s) => s.toLowerCase().includes(query)) ||
        (member.certifications && member.certifications.some((c) => c.toLowerCase().includes(query)));

      return matchDept && matchSearch;
    });
  }, [staff, activeTab, selectedDept, searchQuery]);

  // Aggregate metrics
  const total = staff.length;
  const presentCount = staff.filter((m) => m.status === "present").length;
  const remoteCount = staff.filter((m) => m.status === "remote").length;
  const leaveCount = staff.filter((m) => m.status === "leave").length;
  const shift1Count = staff.filter((m) => m.shift.includes("Shift 1")).length;
  const shift2Count = staff.filter((m) => m.shift.includes("Shift 2")).length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case "AC Manufacturing":
        return "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80";
      case "Refrigerator Line":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80";
      case "Washing Machine Line":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80";
      case "Display & TV Line":
        return "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80";
      case "Quality Assurance":
        return "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80";
      case "Warehouse & Logistics":
        return "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700";
      case "Procurement & Sourcing":
        return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80";
      case "Plant Engineering":
        return "bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/80";
      case "Plant Operations":
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80";
      default:
        return "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700";
    }
  };

  const getDeptDot = (dept: string) => {
    switch (dept) {
      case "AC Manufacturing":
        return "bg-sky-500";
      case "Refrigerator Line":
        return "bg-amber-500";
      case "Washing Machine Line":
        return "bg-emerald-500";
      case "Display & TV Line":
        return "bg-purple-500";
      case "Quality Assurance":
        return "bg-teal-500";
      case "Warehouse & Logistics":
        return "bg-stone-500";
      case "Procurement & Sourcing":
        return "bg-rose-500";
      case "Plant Engineering":
        return "bg-yellow-500";
      case "Plant Operations":
        return "bg-blue-500";
      default:
        return "bg-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header: Title & Actions ── */}
      <PageHeader
        title="Workforce Directory & Shift Operations"
        description="Monitor staff attendance, shift assignments, active shop-floor work centers, and technical competencies."
        action={
          canEditStaff ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={resetStaff}
                className="gap-1.5 text-xs font-semibold"
                title="Reset roster to factory defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Roster</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => setEditingMember(staff[0])}
                className="gap-1.5 text-xs font-semibold"
              >
                <UserCheck className="w-4 h-4" />
                <span>Update Attendance</span>
              </Button>
            </div>
          ) : null
        }
      />

      {/* ── 4 Hero KPI Cards (Unified Industrial Design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Workforce */}
        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-slate-800 dark:border-l-stone-400">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-stone-400">
            <span>Total Active Workforce</span>
            <Users className="w-4 h-4 text-slate-400 dark:text-stone-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {total}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              9 Departments · 6 Active Work Centers
            </p>
          </div>
        </Card>

        {/* Card 2: On Floor Today */}
        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              On Floor Today
            </span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {presentCount}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              {attendanceRate}% Shop-floor operational coverage
            </p>
          </div>
        </Card>

        {/* Card 3: Shift Distribution */}
        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>Shift Manning</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {shift1Count} <span className="text-sm font-normal text-slate-500 dark:text-stone-400">Shift 1</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              {shift2Count} scheduled for Shift 2 (15:30)
            </p>
          </div>
        </Card>

        {/* Card 4: Off Floor / Field Duty / Leave */}
        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span>Away / Field Duty</span>
            <Laptop className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {remoteCount + leaveCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              {remoteCount} Field/Supplier Audit · {leaveCount} On Leave
            </p>
          </div>
        </Card>
      </div>

      {/* ── Filter & Search Section ── */}
      <div className="space-y-3">
        {/* Top Controls: Tabs & View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Sub-Navigation Pills */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 shadow-2xs w-fit overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Personnel ({total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("present")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "present"
                  ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>On Floor ({presentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shift1")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "shift1"
                  ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Shift 1 Morning ({shift1Count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shift2")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "shift2"
                  ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Shift 2 Afternoon ({shift2Count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("offfloor")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "offfloor"
                  ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Away / Leave ({leaveCount + remoteCount})
            </button>
          </div>

          {/* Right: Search + View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-stone-500" />
              <Input
                type="text"
                placeholder="Search name, Employee ID, work center, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-full text-xs"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Table View (Detailed)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Grid View (Personnel Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {departments.map((dept) => {
            const count =
              dept === "Everyone"
                ? total
                : staff.filter((m) => m.department === dept).length;
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer text-xs ${
                  isActive
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-semibold"
                    : "bg-white dark:bg-stone-800 text-slate-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                }`}
              >
                {dept !== "Everyone" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${getDeptDot(dept)}`} />
                )}
                <span>{dept}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "text-slate-400 dark:text-stone-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VIEW 1: TABLE VIEW (Dense, High-Clarity Industrial Roster) ── */}
      {viewMode === "table" && (
        <Card className="rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap text-slate-800 dark:text-stone-200">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-slate-600 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department & Line</th>
                  <th className="py-3 px-4">Assigned Work Center</th>
                  <th className="py-3 px-4">Shift Schedule</th>
                  <th className="py-3 px-4">Floor Status</th>
                  <th className="py-3 px-4">Certifications & Competencies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                      No personnel match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Employee ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-stone-400">
                        {member.employeeId}
                      </td>

                      {/* Staff Member (Avatar + Name + Role + Badge) */}
                      <td className="py-3 px-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setViewingProfile(member)}
                        >
                          <div
                            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-2xs ${member.avatarBg}`}
                          >
                            {member.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                                {member.name}
                              </span>
                              {member.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 dark:bg-amber-600 text-white">
                                  {member.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-stone-400 font-medium">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColor(member.department)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDeptDot(member.department)}`} />
                          <span>{member.department}</span>
                        </span>
                      </td>

                      {/* Work Center */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-stone-200 text-xs">
                          {member.workCenter}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-stone-500">
                          {member.location}
                        </span>
                      </td>

                      {/* Shift Schedule */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-stone-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500" />
                          <span>{member.shift}</span>
                        </div>
                      </td>

                      {/* Floor Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              member.status === "present"
                                ? "bg-emerald-500 animate-pulse"
                                : member.status === "remote"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-stone-200 text-xs block">
                              {member.status === "present" ? "On Floor" : member.status === "remote" ? "Remote / Field Duty" : "On Leave / Off Floor"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-stone-500">
                              {member.statusText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Certifications & Competencies */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {member.certifications && member.certifications.slice(0, 1).map((cert) => (
                            <span
                              key={cert}
                              className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80"
                            >
                              <Award className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              <span>{cert}</span>
                            </span>
                          ))}
                          {member.skills.slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 2 && (
                            <span className="text-[9px] text-slate-400 dark:text-stone-500 px-1 py-0.5">
                              +{member.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProfile(member)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-full text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          {canEditStaff && (
                            <button
                              type="button"
                              onClick={() => setEditingMember(member)}
                              className="px-2.5 py-1 rounded-full bg-slate-900 dark:bg-stone-800 hover:bg-slate-800 dark:hover:bg-stone-700 text-white text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── VIEW 2: CARDS GRID (Spacious, Structured Profiles) ── */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((member) => (
            <Card
              key={member.id}
              className="p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-stone-600 transition-all hover:shadow-xs group relative"
            >
              <div>
                {/* Header: Avatar, Name, Employee ID, Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs ${member.avatarBg}`}
                      >
                        {member.initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-stone-900 ${
                          member.status === "present"
                            ? "bg-emerald-500 animate-pulse"
                            : member.status === "remote"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        title={member.statusText}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 
                          onClick={() => setViewingProfile(member)}
                          className="text-sm font-bold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {member.name}
                        </h3>
                        {member.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 dark:bg-amber-600 text-white">
                            {member.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-stone-400 font-medium">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-stone-500 shrink-0">
                    {member.employeeId}
                  </span>
                </div>

                {/* Department & Shift Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColor(
                      member.department
                    )}`}
                  >
                    {member.department}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{member.shift}</span>
                  </span>
                </div>

                {/* Work Center Assignment Block */}
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800/80 mb-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                    Station / Work Center
                  </span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                    {member.workCenter}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-stone-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{member.location}</span>
                  </div>
                </div>

                {/* Certifications (if any) */}
                {member.certifications && member.certifications.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1">
                    {member.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80"
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        <span>{cert}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Tenure & Status Action */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-400 dark:text-stone-500">
                  Tenure: {member.tenure}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingProfile(member)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                  {canEditStaff && (
                    <button
                      type="button"
                      onClick={() => setEditingMember(member)}
                      className="px-3 py-1 rounded-full bg-slate-900 dark:bg-stone-800 hover:bg-slate-800 dark:hover:bg-stone-700 text-white text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-stone-800 text-white rounded-2xl shadow-xl text-xs font-semibold border border-stone-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Modal 1: Quick Attendance Status Modal ── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-stone-100 text-base">
                  Update Floor Attendance
                </h3>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Update plant floor status & active shift deployment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wide flex items-center justify-between">
                <span>Select Personnel</span>
                <span className="text-[10px] text-slate-400 font-normal">({staff.length} staff rostered)</span>
              </label>
              <select
                value={editingMember.id}
                onChange={(e) => {
                  const found = staff.find((m) => m.id === e.target.value);
                  if (found) setEditingMember(found);
                }}
                className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-slate-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                {staff.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.employeeId} · {m.name} — {m.role} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Currently Selected Employee Card Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <div
                className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs ${editingMember.avatarBg}`}
              >
                {editingMember.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 dark:text-stone-100 text-sm truncate">
                    {editingMember.name}
                  </h4>
                  {editingMember.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 dark:bg-amber-600 text-white">
                      {editingMember.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-stone-400 truncate">
                  {editingMember.role} · {editingMember.workCenter}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-stone-500">
                  {editingMember.shift}
                </p>
              </div>
            </div>

            {/* 3 Status Buttons */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wide">
                Set Real-Time Floor Status:
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "present");
                    showToast(`${editingMember.name} status updated to: On Plant Floor.`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "present"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-2xs"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-left">
                      <span className="block font-bold">In the Building (On Plant Floor)</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-stone-400">Stationed at {editingMember.workCenter}</span>
                    </div>
                  </div>
                  {editingMember.status === "present" && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "remote");
                    showToast(`${editingMember.name} status updated to: Remote / Field Duty.`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "remote"
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-2xs"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="text-left">
                      <span className="block font-bold">Working Remotely / Field Duty</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-stone-400">Supplier audit, logistics transit, or remote task</span>
                    </div>
                  </div>
                  {editingMember.status === "remote" && (
                    <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "leave");
                    showToast(`${editingMember.name} status updated to: On Leave / Off Floor.`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "leave"
                      ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 shadow-2xs"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="text-left">
                      <span className="block font-bold">On Leave / Off Floor (Excused Absence)</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-stone-400">Excused shift absence with backup reassigned</span>
                    </div>
                  </div>
                  {editingMember.status === "leave" && (
                    <Check className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setEditingMember(null)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Detailed Staff Profile Modal ── */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-6 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs ${viewingProfile.avatarBg}`}
                >
                  {viewingProfile.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-stone-100 text-base">
                      {viewingProfile.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-stone-400">
                      ({viewingProfile.employeeId})
                    </span>
                    {viewingProfile.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 dark:bg-amber-600 text-white">
                        {viewingProfile.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-stone-400 font-medium">
                    {viewingProfile.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingProfile(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                  Department
                </span>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColor(viewingProfile.department)}`}>
                  {viewingProfile.department}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                  Shift Hours
                </span>
                <span className="font-semibold text-slate-800 dark:text-stone-200 block">
                  {viewingProfile.shift}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 space-y-1 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                  Assigned Work Center & Facility
                </span>
                <div className="font-bold text-slate-800 dark:text-stone-100 text-xs">
                  {viewingProfile.workCenter}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-stone-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{viewingProfile.location} · Service Tenure: {viewingProfile.tenure}</span>
                </div>
              </div>
            </div>

            {/* Safety Certifications */}
            {viewingProfile.certifications && viewingProfile.certifications.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wide block">
                  Safety Licenses & Quality Certifications
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingProfile.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{cert}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Competencies */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wide block">
                Technical Competencies & Machine Operations
              </span>
              <div className="flex flex-wrap gap-1">
                {viewingProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <Button
                variant="primary"
                onClick={() => {
                  setEditingMember(viewingProfile);
                  setViewingProfile(null);
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Update Status</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => setViewingProfile(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
