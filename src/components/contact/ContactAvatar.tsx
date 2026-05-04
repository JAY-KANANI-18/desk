function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

export function ContactAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = "md",
}: {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const classes =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
        ? "h-16 w-16 text-xs"
        : "h-12 w-12 text-sm";

  return avatarUrl ? (
    <img src={avatarUrl} alt="" className={`${classes} rounded-full object-cover`} />
  ) : (
    <div
      className={`${classes} rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-semibold`}
    >
      {initials(firstName ?? "", lastName ?? "")}
    </div>
  );
}
