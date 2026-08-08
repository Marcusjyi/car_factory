import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getClientStorage } from "@/lib/firebase/config";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function validatePartnerImageFile(file: File) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("JPG, PNG, WEBP만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지당 최대 10MB까지 업로드할 수 있습니다.");
  }
}

export async function uploadPartnerPhoto(
  partnerId: string,
  file: File,
): Promise<{ photoURL: string; photoPath: string }> {
  validatePartnerImageFile(file);
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const photoPath = `partner-images/${partnerId}/${Date.now()}.${ext}`;
  const storageRef = ref(getClientStorage(), photoPath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public,max-age=31536000,immutable",
  });
  const photoURL = await getDownloadURL(storageRef);
  return { photoURL, photoPath };
}

export async function deletePartnerPhoto(photoPath: string | undefined) {
  if (!photoPath) return;
  try {
    await deleteObject(ref(getClientStorage(), photoPath));
  } catch {
    // ignore missing
  }
}
