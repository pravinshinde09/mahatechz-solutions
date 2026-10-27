"use server";

import { revalidatePath } from "next/cache";
import { authedRequest } from "@/lib/api/server";
import type { MediaAsset, MediaPurpose, UploadInstruction } from "@/lib/contracts/media";

export type UploadStart = { ok: true; mediaAssetId: string; upload: UploadInstruction } | { ok: false; message: string };

const endpointFor: Record<string, string> = {
  THUMBNAIL: "/admin/media/images/sign",
  LECTURE_VIDEO: "/admin/media/videos",
  DOCUMENT: "/admin/media/files/upload-url",
  PRACTICE_FILE: "/admin/media/files/upload-url",
};

/** Step 1: the API validates the file and returns where to send the bytes (never a secret). */
export async function startUploadAction(input: { purpose: MediaPurpose; filename: string; mimeType: string; sizeBytes: number; title?: string }): Promise<UploadStart> {
  const endpoint = endpointFor[input.purpose];
  if (!endpoint) return { ok: false, message: "This file type can't be uploaded here." };
  const res = await authedRequest<{ mediaAssetId: string; upload: UploadInstruction }>(endpoint, { method: "POST", body: input });
  return res.ok ? { ok: true, ...res.data } : { ok: false, message: res.error.message };
}

export async function renewUploadAction(mediaAssetId: string): Promise<UploadStart> {
  const res = await authedRequest<{ mediaAssetId: string; upload: UploadInstruction }>(`/admin/media/${mediaAssetId}/renew-upload`, { method: "POST" });
  return res.ok ? { ok: true, ...res.data } : { ok: false, message: res.error.message };
}

/** Step 3: the API verifies what actually arrived (signature, size, magic bytes). */
export async function completeUploadAction(mediaAssetId: string, providerResult?: Record<string, unknown>): Promise<{ ok: true; asset: MediaAsset } | { ok: false; message: string }> {
  const res = await authedRequest<MediaAsset>(`/admin/media/${mediaAssetId}/complete`, { method: "POST", body: providerResult ? { providerResult } : {} });
  return res.ok ? { ok: true, asset: res.data } : { ok: false, message: res.error.message };
}

export async function refreshVideoStatusAction(mediaAssetId: string): Promise<MediaAsset | null> {
  const res = await authedRequest<MediaAsset>(`/admin/media/${mediaAssetId}/refresh-status`, { method: "POST" });
  return res.ok ? res.data : null;
}

export async function deleteMediaAction(mediaAssetId: string): Promise<{ ok: boolean; message: string }> {
  const res = await authedRequest(`/admin/media/${mediaAssetId}`, { method: "DELETE" });
  revalidatePath("/admin/media");
  return res.ok ? { ok: true, message: "Deleted." } : { ok: false, message: res.error.message };
}
