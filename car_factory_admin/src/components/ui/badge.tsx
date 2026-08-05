import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "bg-[#F4F4F4] text-[#464646]",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}

const USER_STATUS_LABEL: Record<string, string> = {
  active: "활성",
  suspended: "정지",
  withdrawn: "탈퇴",
};

export function StatusBadge({ status }: { status?: string }) {
  const label = status
    ? (USER_STATUS_LABEL[status] ?? status)
    : "-";

  if (status === "active" || status === "confirmed" || status === "completed") {
    return <Badge variant="success">{label}</Badge>;
  }
  if (status === "blocked" || status === "suspended" || status === "cancelled") {
    return <Badge variant="danger">{label}</Badge>;
  }
  if (status === "pending" || status === "withdrawn") {
    return <Badge variant="warning">{label}</Badge>;
  }
  return <Badge>{label}</Badge>;
}
