"use client";

import { use } from "react";
import { PartnerEditor } from "../_components/partner-editor";

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PartnerEditor partnerId={id} />;
}
