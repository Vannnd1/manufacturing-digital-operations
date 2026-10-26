import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Users, 
  Building2, 
  Laptop, 
  Clock, 
  Search, 
  MapPin, 
  Plus, 
  RotateCcw,
  Check
} from "lucide-react";
import { Card, Button, Input } from "../components/ui";
import { useStaffStore, type StaffMember } from "../store/useStaffStore";
import { useAuthStore } from "../store/useAuthStore";

export function Staff() {
  const { user } = useAuthStore();
  const { staff, updateStatus, syncCurrentUser, resetStaff } = useStaffStore();
  const [activeTab, setActiveTab] = useState<"all" | "attendance" | "timeoff">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("Everyone");
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize current logged-in user so 'st-1' reflects their real name, not a stranger's
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

  // Department counts
  const departments = [
    "Everyone",
    "Operations",
    "Fabrication",
    "Finishing",
    "Assembly",
    "Quality",
    "Warehouse",
    "Purchasing",
    "Finance",
  ];

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // Sub-tab filter
      if (activeTab === "attendance" && member.status !== "present") return false;
      if (activeTab === "timeoff" && member.status === "present") return false;

      // Department filter
      const matchDept = selectedDept === "Everyone" || member.department === selectedDept;

      // Search query
      const query = searchQuery.toLowerCase();
      const matchSearch =
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.skills.some((s) => s.toLowerCase().includes(query));
      return matchDept && matchSearch;
    });
  }, [staff, activeTab, selectedDept, searchQuery]);

  // Aggregate metrics
  const total = staff.length;
  const presentCount = staff.filter((m) => m.status === "present").length;
  const remoteCount = staff.filter((m) => m.status === "remote").length;
  const leaveCount = staff.filter((m) => m.status === "leave").length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case "Operations":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Fabrication":
        return "bg-orange-50 text-orange-700 border-orange-200/60";
      case "Finishing":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Assembly":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Quality":
        return "bg-teal-50 text-teal-700 border-teal-200/60";
      case "Warehouse":
        return "bg-stone-100 text-stone-700 border-stone-200/60";
      case "Purchasing":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Finance":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200/60";
    }
  };

  const getDeptDot = (dept: string) => {
    switch (dept) {
      case "Operations":
        return "bg-blue-500";
      case "Fabrication":
        return "bg-orange-500";
      case "Finishing":
        return "bg-amber-500";
      case "Assembly":
        return "bg-emerald-500";
      case "Quality":
        return "bg-teal-500";
      case "Warehouse":
        return "bg-stone-500";
      case "Purchasing":
        return "bg-rose-500";
      case "Finance":
        return "bg-purple-500";
      default:
        return "bg-slate-900";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header: Title & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Directory
          </h1>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            variant="secondary"
            onClick={resetStaff}
            className="text-xs font-medium text-slate-600 gap-1.5 rounded-full border-stone-200/90 hover:bg-stone-50"
            title="Reset to default roster"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={() => setEditingMember(staff[0])}
            className="text-xs font-medium bg-[#18181B] hover:bg-black text-white gap-1.5 rounded-full shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Update Attendance
          </Button>
        </div>
      </div>

      {/* ── Sub-navigation Tabs (Cleanly separated under title) ── */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 bg-stone-100/90 dark:bg-[#18181B] p-1 rounded-full border border-stone-200/70 dark:border-stone-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-2xs font-bold border border-transparent dark:border-stone-700"
                : "text-slate-500 dark:text-stone-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "attendance"
                ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-2xs font-bold border border-transparent dark:border-stone-700"
                : "text-slate-500 dark:text-stone-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Attendance ({presentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeoff")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "timeoff"
                ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-2xs font-bold border border-transparent dark:border-stone-700"
                : "text-slate-500 dark:text-stone-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Time off ({leaveCount + remoteCount})
          </button>
        </div>
      </div>

      {/* ── 4 Hero KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: People on the team (Dark #18181B) */}
        <div className="bg-[#18181B] text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-34">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">People on the team</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">{total}</div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">3 part-time or contract</p>
          </div>
        </div>

        {/* Card 2: In the building today (Pastel Blue #E0EDFD) */}
        <div className="bg-[#E0EDFD] text-slate-900 rounded-2xl p-5 border border-blue-200/50 shadow-xs relative overflow-hidden flex flex-col justify-between h-34">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">In the building today</span>
            <Building2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-blue-950">
              {presentCount}
            </div>
            <p className="text-[11px] text-blue-800 mt-1 font-semibold">{attendanceRate}% floor rate</p>
          </div>
        </div>

        {/* Card 3: Working remotely / On leave (Clean White) */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-stone-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-34">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Working remotely</span>
            <Laptop className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
              {remoteCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Denver · Seattle ({leaveCount} on leave)
            </p>
          </div>
        </div>

        {/* Card 4: Average tenure (Clean White) */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-stone-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-34">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Average tenure</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
              2.7 <span className="text-sm font-normal text-slate-500">yrs</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">longest 6.6 yrs</p>
          </div>
        </div>
      </div>

      {/* ── Search Bar & Filter Strip ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search name, role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full border-stone-200/90 bg-white text-xs shadow-2xs focus:border-slate-400 focus:ring-0"
            />
          </div>

          {/* View toggle badge */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-slate-900 shadow-2xs">
              Cards ({filteredStaff.length})
            </span>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#18181B] text-white shadow-xs font-semibold"
                    : "bg-white text-slate-600 border border-stone-200/80 hover:bg-stone-50"
                }`}
              >
                {dept !== "Everyone" && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getDeptDot(dept)}`}
                  />
                )}
                <span>{dept}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Directory Cards Grid (5 cols) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {filteredStaff.map((member) => {
          return (
            <Card
              key={member.id}
              className="p-4 bg-white border-stone-200/80 rounded-2xl flex flex-col justify-between hover:border-stone-300 transition-all hover:shadow-2xs group relative"
            >
              {/* Card Top: Avatar & Badges */}
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center font-mono ${member.avatarBg}`}
                    >
                      {member.initials}
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.status === "present"
                          ? "bg-emerald-500"
                          : member.status === "remote"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      title={member.statusText}
                    />
                  </div>

                  {member.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-slate-600 border border-stone-200/50">
                      {member.badge}
                    </span>
                  )}
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {member.role}
                  </p>
                </div>

                {/* Department & Status Tag */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDeptColor(
                      member.department
                    )}`}
                  >
                    {member.department}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {member.statusText}
                  </span>
                </div>

                {/* Skills Chips */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Location, Tenure & Attendance Controls */}
              <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1 truncate font-medium text-slate-500">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{member.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 text-[10px]">
                    ⌛ {member.tenure}
                  </span>
                  {/* Quick Status Update Button */}
                  <button
                    type="button"
                    onClick={() => setEditingMember(member)}
                    className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    title={`Ubah status kehadiran ${member.name}`}
                  >
                    Ubah Status
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold border border-stone-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Quick Attendance Modal ── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-xl space-y-4">
            
            {/* Employee Selector Dropdown (Allows changing anyone's attendance) */}
            <div className="space-y-1.5 pb-2 border-b border-stone-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                <span>Pilih Karyawan / Employee</span>
                <span className="text-[10px] text-slate-400 font-normal">({staff.length} staf)</span>
              </label>
              <select
                value={editingMember.id}
                onChange={(e) => {
                  const found = staff.find((m) => m.id === e.target.value);
                  if (found) setEditingMember(found);
                }}
                className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                {staff.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role} ({m.department}){m.badge === "You" ? " ★ Anda (Akun Login)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Currently Selected Employee Info */}
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center font-mono ${editingMember.avatarBg}`}
              >
                {editingMember.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-base truncate">
                    {editingMember.name}
                  </h3>
                  {editingMember.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 text-slate-700 border border-stone-200">
                      {editingMember.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{editingMember.role} · {editingMember.department}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Set Status Kehadiran / Floor Status:
              </label>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "present");
                    showToast(`${editingMember.name} diset hadir di lantai pabrik.`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "present"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    In the building (Hadir di Pabrik)
                  </span>
                  {editingMember.status === "present" && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "remote");
                    showToast(`${editingMember.name} diset bekerja jarak jauh (remote).`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "remote"
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Working remotely (Dinas Luar / Remote)
                  </span>
                  {editingMember.status === "remote" && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateStatus(editingMember.id, "leave");
                    showToast(`${editingMember.name} diset cuti / off floor.`);
                    setEditingMember(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    editingMember.status === "leave"
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    On leave / Off floor (Cuti / Izin)
                  </span>
                  {editingMember.status === "leave" && (
                    <Check className="w-4 h-4 text-rose-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setEditingMember(null)}
                className="rounded-xl text-xs"
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
