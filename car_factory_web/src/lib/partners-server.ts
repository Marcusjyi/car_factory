import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Installer } from "@/lib/installers-types";
import { FALLBACK_INSTALLERS } from "@/lib/installers-fallback";

function mapDoc(id: string, data: DocumentData): Installer | null {
  if (data.isActive === false) return null;
  return {
    id,
    name: String(data.name ?? ""),
    region: String(data.region ?? ""),
    address: String(data.address ?? ""),
    phone: String(data.phone ?? ""),
    specialties: Array.isArray(data.specialties)
      ? data.specialties.map(String)
      : [],
    hours: String(data.hours ?? ""),
    description: String(data.description ?? ""),
    image: String(data.photoURL ?? data.image ?? ""),
    badges: Array.isArray(data.badges) ? data.badges.map(String) : [],
    specialtyLabel: data.specialtyLabel
      ? String(data.specialtyLabel)
      : undefined,
    ratingAverage:
      typeof data.ratingAverage === "number" ? data.ratingAverage : undefined,
    ratingCount:
      typeof data.ratingCount === "number" ? data.ratingCount : undefined,
  };
}

export async function listInstallers(): Promise<Installer[]> {
  try {
    const snap = await getAdminDb()
      .collection("partners")
      .where("isActive", "==", true)
      .orderBy("name", "asc")
      .limit(200)
      .get();

    if (snap.empty) return FALLBACK_INSTALLERS;

    const rows = snap.docs
      .map((d) => mapDoc(d.id, d.data()))
      .filter((x): x is Installer => x != null && Boolean(x.name));
    return rows.length ? rows : FALLBACK_INSTALLERS;
  } catch (err) {
    console.error("[partners] listInstallers failed", err);
    return FALLBACK_INSTALLERS;
  }
}

export async function getInstallerById(
  id: string,
): Promise<Installer | null> {
  try {
    const snap = await getAdminDb().collection("partners").doc(id).get();
    if (snap.exists) {
      const mapped = mapDoc(snap.id, snap.data() ?? {});
      if (mapped) return mapped;
    }
  } catch (err) {
    console.error("[partners] getInstallerById failed", err);
  }
  return FALLBACK_INSTALLERS.find((s) => s.id === id) ?? null;
}
