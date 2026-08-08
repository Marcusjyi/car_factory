export type { Installer } from "@/lib/installers-types";
export { FALLBACK_INSTALLERS as INSTALLERS } from "@/lib/installers-fallback";

import { FALLBACK_INSTALLERS } from "@/lib/installers-fallback";

/** 동기 폴백 (클라이언트·빌드용). 서버에서는 listInstallers / getInstallerById 사용 */
export function getInstallerById(id: string) {
  return FALLBACK_INSTALLERS.find((shop) => shop.id === id) ?? null;
}
