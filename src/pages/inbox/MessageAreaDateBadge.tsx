import { Tag } from "../../components/ui/Tag";

export function MessageAreaDateBadge({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-center py-2">
      <Tag
        label={label}
        size="sm"
        bgColor="gray"
        textColor="var(--color-gray-700)"
        className="pointer-events-none select-none shadow-sm"
        style={{
          backgroundColor: "hsl(var(--background))",
          borderColor: "var(--color-gray-200)",
        }}
      />
    </div>
  );
}
