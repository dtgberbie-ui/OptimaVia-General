import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import {
  ArrowLeft, Edit2, Phone, Mail, MapPin, Camera, Plus, ChevronRight,
  Loader2, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type EmployeeProfile = {
  id: number; userId: number; jobTitle: string | null; department: string | null;
  employmentType: string | null; startDate: string | null; endDate: string | null;
  payRate: number | null; payType: string | null;
  streetAddress: string | null; city: string | null; state: string | null; zipCode: string | null;
  emergencyContactName: string | null; emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null; profilePhotoUrl: string | null;
};

type EmployeeUser = {
  id: number; name: string | null; username: string; email: string | null;
  phone: string | null; status: string; role: string;
  employeeProfile: EmployeeProfile | null;
};

type NoteWithAuthor = {
  id: number; userId: number; authorId: number | null; note: string; createdAt: string;
  author: { id: number; name: string | null; username: string } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null, username: string) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return username.slice(0, 2).toUpperCase();
}

function formatDate(s: string | null | undefined) {
  if (!s) return null;
  const d = new Date(s + (s.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPay(rate: number | null, type: string | null) {
  if (!rate) return "—";
  const formatted = `$${rate.toFixed(2)}`;
  return type === "salary" ? `${formatted}/yr` : `${formatted}/hr`;
}

function formatEmploymentType(t: string | null) {
  if (!t) return "—";
  return { full_time: "Full-time", part_time: "Part-time", contract: "Contract" }[t] ?? t;
}

function statusBadgeStyle(status: string) {
  if (status === "active")     return { bg: "#E1F5EE", color: "#085041" };
  if (status === "terminated") return { bg: "#FCEBEB", color: "#791F1F" };
  return { bg: "#F1EFE8", color: "#444441" };
}

function buildAddress(p: EmployeeProfile | null) {
  if (!p) return null;
  const parts = [p.streetAddress, p.city, p.state, p.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// ── Edit form type ────────────────────────────────────────────────────────────

type EditForm = {
  name: string; email: string; phone: string;
  jobTitle: string; department: string; employmentType: string;
  startDate: string; endDate: string; payRate: string; payType: string;
  streetAddress: string; city: string; state: string; zipCode: string;
  emergencyContactName: string; emergencyContactPhone: string;
  emergencyContactRelationship: string; profilePhotoUrl: string;
};

function buildEditForm(emp: EmployeeUser): EditForm {
  const p = emp.employeeProfile;
  return {
    name: emp.name ?? "",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    jobTitle: p?.jobTitle ?? "",
    department: p?.department ?? "",
    employmentType: p?.employmentType ?? "full_time",
    startDate: p?.startDate ?? "",
    endDate: p?.endDate ?? "",
    payRate: p?.payRate != null ? String(p.payRate) : "",
    payType: p?.payType ?? "hourly",
    streetAddress: p?.streetAddress ?? "",
    city: p?.city ?? "",
    state: p?.state ?? "",
    zipCode: p?.zipCode ?? "",
    emergencyContactName: p?.emergencyContactName ?? "",
    emergencyContactPhone: p?.emergencyContactPhone ?? "",
    emergencyContactRelationship: p?.emergencyContactRelationship ?? "",
    profilePhotoUrl: p?.profilePhotoUrl ?? "",
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const empId = parseInt(id);
  const [, navigate] = useLocation();
  const { data: currentUser } = useUser();
  const { toast } = useToast();

  const isOwner = currentUser?.role === "employer";
  const isSelf = currentUser?.id === empId;
  const canEdit = isOwner;

  // State
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminateEndDate, setTerminateEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: emp, isLoading } = useQuery<EmployeeUser>({
    queryKey: ["/api/employees", empId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}`);
      if (!res.ok) throw new Error("Employee not found");
      return res.json();
    },
  });

  const { data: notes = [] } = useQuery<NoteWithAuthor[]>({
    queryKey: ["/api/employees", empId, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/notes`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOwner,
  });

  // Populate edit form when employee data loads
  useEffect(() => {
    if (emp && !editForm) setEditForm(buildEditForm(emp));
  }, [emp]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/employees/${empId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empId] });
      setEditing(false);
      toast({ title: "Profile updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status: string }) =>
      apiRequest("PATCH", `/api/employees/${empId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empId] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      apiRequest("POST", `/api/employees/${empId}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empId, "notes"] });
      setNoteText("");
      setShowAddNote(false);
      toast({ title: "Note added" });
    },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  // Photo picker
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditForm(f => f ? { ...f, profilePhotoUrl: base64 } : f);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!editForm) return;
    // Status changed to terminated → show confirm dialog instead
    if (editForm && emp && emp.status !== "terminated") {
      // will be caught via terminate dialog if status is terminated
    }
    updateMutation.mutate({
      name: editForm.name || null,
      email: editForm.email || null,
      phone: editForm.phone || null,
      jobTitle: editForm.jobTitle || null,
      department: editForm.department || null,
      employmentType: editForm.employmentType || null,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      payRate: editForm.payRate ? parseFloat(editForm.payRate) : null,
      payType: editForm.payType || null,
      streetAddress: editForm.streetAddress || null,
      city: editForm.city || null,
      state: editForm.state || null,
      zipCode: editForm.zipCode || null,
      emergencyContactName: editForm.emergencyContactName || null,
      emergencyContactPhone: editForm.emergencyContactPhone || null,
      emergencyContactRelationship: editForm.emergencyContactRelationship || null,
      profilePhotoUrl: editForm.profilePhotoUrl || null,
    });
  }

  function handleCancel() {
    if (emp) setEditForm(buildEditForm(emp));
    setEditing(false);
  }

  function confirmTerminate() {
    statusMutation.mutate({ status: "terminated" });
    if (editForm) {
      updateMutation.mutate({ endDate: terminateEndDate });
    }
    setShowTerminateDialog(false);
    setEditing(false);
  }

  function handleRehire() {
    statusMutation.mutate({ status: "active" });
    updateMutation.mutate({ endDate: null });
    toast({ title: "Employee rehired" });
  }

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex flex-col items-center gap-2 py-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-slate-500">Employee not found.</p>
        <button onClick={() => navigate("/employer/team")} className="text-primary text-sm mt-2">Go back</button>
      </div>
    );
  }

  const profile = emp.employeeProfile;
  const badge = statusBadgeStyle(emp.status);
  const address = buildAddress(profile);
  const ini = initials(emp.name, emp.username);
  const photoUrl = editing ? editForm?.profilePhotoUrl : profile?.profilePhotoUrl;

  // History timeline (derived)
  const historyItems: { label: string; date: string | null }[] = [];
  if (profile?.startDate) historyItems.push({ label: "Started", date: profile.startDate });
  if (emp.status === "terminated" && profile?.endDate) {
    historyItems.push({ label: "Terminated", date: profile.endDate });
  }
  const historyDesc = [...historyItems].reverse(); // newest first

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => navigate("/employer/team")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 -ml-1"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Team</span>
        </button>
        {canEdit && !editing && (
          <Button
            variant="outline" size="sm"
            onClick={() => { setEditing(true); if (emp) setEditForm(buildEditForm(emp)); }}
            data-testid="button-edit"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        )}
      </div>

      {/* ── Profile header ───────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pb-5 px-4">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={emp.name ?? emp.username}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
            >
              {ini}
            </div>
          )}
          {editing && (
            <>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 text-white"
                data-testid="button-change-photo"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </>
          )}
        </div>

        {editing ? (
          <div className="w-full mt-3 space-y-2">
            <Input
              className="text-center font-semibold text-lg"
              value={editForm?.name ?? ""}
              onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
              placeholder="Full name"
              data-testid="input-name"
            />
          </div>
        ) : (
          <>
            <h1 className="mt-3 text-lg font-semibold text-slate-900" data-testid="text-employee-name">
              {emp.name || emp.username}
            </h1>
            {profile?.jobTitle && (
              <p className="text-sm text-slate-500 mt-0.5">{profile.jobTitle}</p>
            )}
            <span
              className="mt-2 font-medium"
              style={{
                backgroundColor: badge.bg, color: badge.color,
                fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 8,
              }}
              data-testid="badge-status"
            >
              {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
            </span>
          </>
        )}
      </div>

      <div className="px-4 space-y-3">

        {/* ── Card 1: Contact ──────────────────────────────────────────── */}
        <InfoCard title="Contact">
          {editing ? (
            <div className="space-y-2">
              <FormRow label="Email">
                <Input value={editForm?.email ?? ""} type="email" onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)} placeholder="email@example.com" data-testid="input-email" />
              </FormRow>
              <FormRow label="Phone">
                <Input value={editForm?.phone ?? ""} type="tel" onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} placeholder="555-0101" data-testid="input-phone" />
              </FormRow>
              <FormRow label="Street">
                <Input value={editForm?.streetAddress ?? ""} onChange={e => setEditForm(f => f ? { ...f, streetAddress: e.target.value } : f)} placeholder="123 Main St" data-testid="input-street" />
              </FormRow>
              <div className="grid grid-cols-3 gap-2">
                <Input value={editForm?.city ?? ""} onChange={e => setEditForm(f => f ? { ...f, city: e.target.value } : f)} placeholder="City" data-testid="input-city" />
                <Input value={editForm?.state ?? ""} onChange={e => setEditForm(f => f ? { ...f, state: e.target.value } : f)} placeholder="State" data-testid="input-state" />
                <Input value={editForm?.zipCode ?? ""} onChange={e => setEditForm(f => f ? { ...f, zipCode: e.target.value } : f)} placeholder="ZIP" data-testid="input-zip" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {emp.phone ? (
                <a href={`tel:${emp.phone}`} className="flex items-center gap-3 text-sm text-slate-800 hover:text-primary" data-testid="link-phone">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  {emp.phone}
                </a>
              ) : <EmptyRow icon={<Phone className="h-4 w-4 text-slate-300" />} text="No phone on file" />}

              {emp.email ? (
                <a href={`mailto:${emp.email}`} className="flex items-center gap-3 text-sm text-slate-800 hover:text-primary" data-testid="link-email">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  {emp.email}
                </a>
              ) : <EmptyRow icon={<Mail className="h-4 w-4 text-slate-300" />} text="No email on file" />}

              {address ? (
                <a href={mapsUrl(address)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm text-slate-800 hover:text-primary" data-testid="link-address">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  {address}
                </a>
              ) : <EmptyRow icon={<MapPin className="h-4 w-4 text-slate-300" />} text="No address on file" />}
            </div>
          )}
        </InfoCard>

        {/* ── Card 2: Employment ──────────────────────────────────────────── */}
        <InfoCard title="Employment">
          {editing ? (
            <div className="space-y-2">
              <FormRow label="Job Title">
                <Input value={editForm?.jobTitle ?? ""} onChange={e => setEditForm(f => f ? { ...f, jobTitle: e.target.value } : f)} placeholder="e.g. Service Technician" data-testid="input-job-title" />
              </FormRow>
              <FormRow label="Department">
                <Input value={editForm?.department ?? ""} onChange={e => setEditForm(f => f ? { ...f, department: e.target.value } : f)} placeholder="e.g. Operations" data-testid="input-department" />
              </FormRow>
              <FormRow label="Type">
                <select
                  value={editForm?.employmentType ?? "full_time"}
                  onChange={e => setEditForm(f => f ? { ...f, employmentType: e.target.value } : f)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  data-testid="select-employment-type"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </FormRow>
              <FormRow label="Start Date">
                <Input type="date" value={editForm?.startDate ?? ""} onChange={e => setEditForm(f => f ? { ...f, startDate: e.target.value } : f)} data-testid="input-start-date" />
              </FormRow>
              <FormRow label="End Date">
                <Input type="date" value={editForm?.endDate ?? ""} onChange={e => setEditForm(f => f ? { ...f, endDate: e.target.value } : f)} data-testid="input-end-date" />
              </FormRow>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Pay Rate</Label>
                  <Input type="number" step="0.01" min="0" value={editForm?.payRate ?? ""} onChange={e => setEditForm(f => f ? { ...f, payRate: e.target.value } : f)} placeholder="0.00" data-testid="input-pay-rate" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Pay Type</Label>
                  <select
                    value={editForm?.payType ?? "hourly"}
                    onChange={e => setEditForm(f => f ? { ...f, payType: e.target.value } : f)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    data-testid="select-pay-type"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>
              </div>

              {/* Status change */}
              <FormRow label="Status">
                <select
                  value={emp.status}
                  onChange={e => {
                    if (e.target.value === "terminated") {
                      setShowTerminateDialog(true);
                    } else {
                      statusMutation.mutate({ status: e.target.value });
                    }
                  }}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  data-testid="select-status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </FormRow>
            </div>
          ) : (
            <div className="space-y-2.5">
              <DetailRow label="Employment type" value={formatEmploymentType(profile?.employmentType)} />
              <DetailRow label="Start date" value={formatDate(profile?.startDate) ?? "—"} />
              <DetailRow label="End date" value={formatDate(profile?.endDate) ?? "Present"} />
              {isOwner && <DetailRow label="Pay rate" value={formatPay(profile?.payRate ?? null, profile?.payType ?? null)} />}
              <DetailRow label="Department" value={profile?.department ?? "—"} />
            </div>
          )}
        </InfoCard>

        {/* ── Card 3: Emergency Contact (employer only) ─────────────────── */}
        {isOwner && (
          <InfoCard title="Emergency contact">
            {editing ? (
              <div className="space-y-2">
                <FormRow label="Name">
                  <Input value={editForm?.emergencyContactName ?? ""} onChange={e => setEditForm(f => f ? { ...f, emergencyContactName: e.target.value } : f)} placeholder="Contact name" data-testid="input-emergency-name" />
                </FormRow>
                <FormRow label="Phone">
                  <Input type="tel" value={editForm?.emergencyContactPhone ?? ""} onChange={e => setEditForm(f => f ? { ...f, emergencyContactPhone: e.target.value } : f)} placeholder="555-0100" data-testid="input-emergency-phone" />
                </FormRow>
                <FormRow label="Relationship">
                  <Input value={editForm?.emergencyContactRelationship ?? ""} onChange={e => setEditForm(f => f ? { ...f, emergencyContactRelationship: e.target.value } : f)} placeholder="e.g. Spouse, Parent" data-testid="input-emergency-relationship" />
                </FormRow>
              </div>
            ) : profile?.emergencyContactName ? (
              <div className="space-y-2.5">
                <DetailRow label="Name" value={profile.emergencyContactName} />
                {profile.emergencyContactPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Phone</span>
                    <a href={`tel:${profile.emergencyContactPhone}`} className="text-sm text-primary" data-testid="link-emergency-phone">
                      {profile.emergencyContactPhone}
                    </a>
                  </div>
                )}
                <DetailRow label="Relationship" value={profile.emergencyContactRelationship ?? "—"} />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">No emergency contact on file</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-primary font-medium"
                  data-testid="button-add-emergency"
                >Add</button>
              </div>
            )}
          </InfoCard>
        )}

        {/* ── Card 4: Notes (employer only) ─────────────────────────────── */}
        {isOwner && (
          <InfoCard
            title="Notes"
            action={
              !showAddNote ? (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                  data-testid="button-add-note"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Note
                </button>
              ) : null
            }
          >
            {showAddNote && (
              <div className="mb-3">
                <Textarea
                  placeholder="Write a note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  className="text-sm mb-2"
                  data-testid="textarea-note"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => { if (noteText.trim()) addNoteMutation.mutate(noteText.trim()); }}
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                    data-testid="button-save-note"
                  >
                    {addNoteMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddNote(false); setNoteText(""); }} data-testid="button-cancel-note">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {notes.length === 0 && !showAddNote && (
              <p className="text-sm text-slate-400">No notes yet.</p>
            )}

            <div className="space-y-0">
              {notes.map((note, i) => (
                <div key={note.id}>
                  {i > 0 && <div className="border-t border-slate-100 my-2.5" />}
                  <p className="text-sm text-slate-800 leading-relaxed" data-testid={`text-note-${note.id}`}>{note.note}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Added by {note.author?.name || note.author?.username || "Unknown"} on {formatDate(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
        )}

        {/* ── Card 5: History ───────────────────────────────────────────── */}
        <InfoCard title="History">
          {historyDesc.length === 0 ? (
            <p className="text-sm text-slate-400">No history yet.</p>
          ) : (
            <div className="space-y-0">
              {historyDesc.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                    {i < historyDesc.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1 mb-1 min-h-[20px]" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    {item.date && <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        {/* ── Rehire button (terminated only) ──────────────────────────── */}
        {isOwner && emp.status === "terminated" && !editing && (
          <Button
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50"
            onClick={handleRehire}
            disabled={statusMutation.isPending}
            data-testid="button-rehire"
          >
            {statusMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Rehire Employee
          </Button>
        )}
      </div>

      {/* ── Fixed Save/Cancel bar (edit mode) ───────────────────────────── */}
      {editing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-lg z-20">
          <Button variant="outline" className="flex-1" onClick={handleCancel} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-edit"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}

      {/* ── Terminate confirmation dialog ────────────────────────────────── */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Mark as Terminated?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-slate-600">
              This will mark <strong>{emp.name || emp.username}</strong> as terminated and disable their login access.
            </p>
            <div>
              <Label className="text-sm">End Date</Label>
              <Input
                type="date"
                value={terminateEndDate}
                onChange={e => setTerminateEndDate(e.target.value)}
                className="mt-1"
                data-testid="input-terminate-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminateDialog(false)} data-testid="button-cancel-terminate">Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmTerminate}
              disabled={statusMutation.isPending}
              data-testid="button-confirm-terminate"
            >
              {statusMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoCard({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-slate-500 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      {icon}
      <span>{text}</span>
    </div>
  );
}
