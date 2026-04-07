import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, User, Camera, Key, ArrowLeft, CheckCircle, Play, Loader2, AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type JobPhoto = { id: number; photoType: string; photoUrl: string; note: string | null; takenAt: string };
type Employee = { id: number; name: string | null; username: string };
type ServiceJob = {
  id: number; title: string; clientName: string; serviceAddress: string;
  scheduledDate: string; scheduledTime: string | null; status: string;
  priority: string; notes: string | null; keyTrackingEnabled: boolean;
  assignedEmployee: Employee | null; photos: JobPhoto[];
  startedAt: string | null; completedAt: string | null;
};

function statusBg(s: string) {
  if (s === "completed") return "bg-green-100 text-green-700";
  if (s === "in_progress") return "bg-blue-100 text-blue-700";
  if (s === "assigned") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

function statusLabel(s: string) {
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ServiceJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTo, setReassignTo] = useState<string>("none");

  const isEmployee = user?.role === "employee";
  const backPath = isEmployee ? "/employee/jobs" : "/employer/service-jobs";

  const { data: job, isLoading } = useQuery<ServiceJob>({
    queryKey: ["/api/service-jobs", id],
    queryFn: async () => {
      const res = await fetch(`/api/service-jobs/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/business/employees"],
    enabled: !isEmployee,
  });

  const reassignMutation = useMutation({
    mutationFn: (assignedTo: number | null) =>
      apiRequest("PATCH", `/api/service-jobs/${id}`, { assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs"] });
      setShowReassign(false);
      toast({ title: "Job reassigned successfully" });
    },
    onError: () => toast({ title: "Failed to reassign job", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/service-jobs/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs"] });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ photoUrl, photoType }: { photoUrl: string; photoType: string }) =>
      apiRequest("POST", `/api/service-jobs/${id}/photos`, { photoUrl, photoType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs", id] });
      setUploadingType(null);
      toast({ title: "Photo uploaded!" });
    },
    onError: () => toast({ title: "Failed to upload photo", variant: "destructive" }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadingType(type);
      uploadPhoto.mutate({ photoUrl: base64, photoType: type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function openCamera(type: string) {
    setUploadingType(type);
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("data-photo-type", type);
      fileInputRef.current.click();
    }
  }

  function getPhotos(type: string) {
    return job?.photos.filter(p => p.photoType === type) ?? [];
  }

  const hasCheckin = getPhotos("checkin").length > 0;
  const hasCheckout = getPhotos("checkout").length > 0;
  const hasKeyPickup = getPhotos("key_pickup").length > 0;
  const hasKeyReturn = getPhotos("key_return").length > 0;

  const canStart = job?.status === "assigned" || job?.status === "unassigned";
  const canComplete = job?.status === "in_progress" && (!job.keyTrackingEnabled || hasKeyReturn);
  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job?.serviceAddress ?? "")}`;

  if (isLoading) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-4 py-10 text-center text-slate-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        Job not found
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      {/* Back button */}
      <button onClick={() => navigate(backPath)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700" data-testid="button-back">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </button>

      {/* Job header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900" data-testid="heading-job-detail">{job.clientName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${statusBg(job.status)}`}>{statusLabel(job.status)}</span>
            </div>
            {job.keyTrackingEnabled && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-medium">
                <Key className="h-3 w-3" /> Key Required
              </div>
            )}
          </div>

          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-3 py-2.5 mb-3 hover:bg-blue-100 transition-colors"
            data-testid="link-map"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{job.serviceAddress}</span>
          </a>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime}` : ""}
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              {job.assignedEmployee
                ? (job.assignedEmployee.name || job.assignedEmployee.username)
                : <span className="text-amber-600 font-medium">Unassigned</span>}
              {!isEmployee && (
                <button
                  onClick={() => { setReassignTo(job.assignedEmployee ? String(job.assignedEmployee.id) : "none"); setShowReassign(true); }}
                  className="ml-1 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                  data-testid="button-reassign"
                >
                  Reassign
                </button>
              )}
            </div>
          </div>

          {job.notes && (
            <div className="mt-3 bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
              {job.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {isEmployee && (
        <div className="space-y-2">
          {canStart && (
            <Button
              className="w-full h-12 text-base"
              onClick={() => updateStatus.mutate("in_progress")}
              disabled={updateStatus.isPending}
              data-testid="button-start-job"
            >
              {updateStatus.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Start Job
            </Button>
          )}
          {job.status === "in_progress" && (
            <Button
              className="w-full h-12 text-base"
              variant={canComplete ? "default" : "outline"}
              onClick={() => canComplete ? updateStatus.mutate("completed") : toast({ title: job.keyTrackingEnabled ? "Upload key return photo first" : "Cannot complete yet", variant: "destructive" })}
              disabled={updateStatus.isPending || !canComplete}
              data-testid="button-complete-job"
            >
              {updateStatus.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Complete Job {job.keyTrackingEnabled && !hasKeyReturn ? "(Upload key return first)" : ""}
            </Button>
          )}
        </div>
      )}

      {/* Photo sections */}
      <div className="space-y-3">
        {/* Key tracking photos */}
        {job.keyTrackingEnabled && (
          <>
            <PhotoSection
              title="Key Pickup Photo"
              type="key_pickup"
              photos={getPhotos("key_pickup")}
              canUpload={job.status === "in_progress" && !hasKeyPickup}
              onUpload={openCamera}
              uploading={uploadingType === "key_pickup" && uploadPhoto.isPending}
              required
            />
            <PhotoSection
              title="Key Return Photo"
              type="key_return"
              photos={getPhotos("key_return")}
              canUpload={job.status === "in_progress" && !hasKeyReturn}
              onUpload={openCamera}
              uploading={uploadingType === "key_return" && uploadPhoto.isPending}
              required
            />
          </>
        )}

        {/* Check-in / Check-out photos */}
        <PhotoSection
          title="Check-in Photo"
          type="checkin"
          photos={getPhotos("checkin")}
          canUpload={job.status === "in_progress" && !hasCheckin}
          onUpload={openCamera}
          uploading={uploadingType === "checkin" && uploadPhoto.isPending}
        />
        {hasCheckin && (
          <PhotoSection
            title="Check-out Photo"
            type="checkout"
            photos={getPhotos("checkout")}
            canUpload={job.status === "in_progress" && !hasCheckout}
            onUpload={openCamera}
            uploading={uploadingType === "checkout" && uploadPhoto.isPending}
          />
        )}
      </div>

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const type = fileInputRef.current?.getAttribute("data-photo-type") || "checkin";
          handleFileChange(e, type);
        }}
      />

      {/* Reassign Dialog */}
      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> Reassign Job
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 mb-3">Select a new employee to assign this job to, or leave unassigned.</p>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger data-testid="select-reassign-employee">
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {employees?.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name || e.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassign(false)}>Cancel</Button>
            <Button
              onClick={() => reassignMutation.mutate(reassignTo === "none" ? null : parseInt(reassignTo))}
              disabled={reassignMutation.isPending}
              data-testid="button-confirm-reassign"
            >
              {reassignMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoSection({ title, type, photos, canUpload, onUpload, uploading, required }: {
  title: string; type: string; photos: JobPhoto[]; canUpload: boolean;
  onUpload: (type: string) => void; uploading: boolean; required?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4 pb-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4 text-slate-400" />
          {title}
          {required && <span className="text-red-500 text-xs">Required</span>}
          {photos.length > 0 && <span className="ml-auto text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Done</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        {photos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map(p => (
              <img key={p.id} src={p.photoUrl} alt={title} className="h-24 w-24 object-cover rounded-lg shrink-0 border" />
            ))}
          </div>
        ) : canUpload ? (
          <Button variant="outline" size="sm" onClick={() => onUpload(type)} disabled={uploading} className="w-full" data-testid={`button-upload-${type}`}>
            {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
            Take Photo
          </Button>
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">Not yet uploaded</p>
        )}
      </CardContent>
    </Card>
  );
}
