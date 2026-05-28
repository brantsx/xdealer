import type { VehiclePhoto } from "../../types";
import { supabase } from "./client";

export interface PhotoUploadDraft {
  id: string;
  fileName: string;
  publicUrl: string;
  file: File;
}

function safeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadVehiclePhotos({
  organisationId,
  vehicleId,
  drafts,
  timestamp,
}: {
  organisationId: string;
  vehicleId: string;
  drafts: PhotoUploadDraft[];
  timestamp: string;
}): Promise<VehiclePhoto[]> {
  if (!supabase) {
    return drafts.map((draft) => ({
      id: draft.id,
      organisationId,
      vehicleId,
      fileName: draft.fileName,
      storagePath: `local-preview/${vehicleId}/${draft.fileName}`,
      publicUrl: draft.publicUrl,
      caption: draft.fileName,
      createdAt: timestamp,
    }));
  }

  const uploaded: VehiclePhoto[] = [];
  for (const draft of drafts) {
    const storagePath = `${organisationId}/${vehicleId}/${draft.id}-${safeFileName(draft.fileName)}`;
    const { error } = await supabase.storage.from("vehicle-photos").upload(storagePath, draft.file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = await supabase.storage.from("vehicle-photos").createSignedUrl(storagePath, 60 * 60);
    uploaded.push({
      id: draft.id,
      organisationId,
      vehicleId,
      fileName: draft.fileName,
      storagePath,
      publicUrl: data?.signedUrl ?? draft.publicUrl,
      caption: draft.fileName,
      createdAt: timestamp,
    });
  }
  return uploaded;
}
