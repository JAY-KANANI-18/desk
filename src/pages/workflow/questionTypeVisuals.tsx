import {
  AtSign,
  Calendar,
  Hash,
  Link,
  List,
  Mail,
  MapPin,
  Phone,
  Star,
  Type,
  type AppIcon,
} from "@/components/ui/icons";
import type { IconSelectOption } from "@/components/ui/select";
import type { QuestionType } from "./workflow.types";

interface QuestionTypeVisual {
  Icon: AppIcon;
  color: string;
  marker: string;
}

const QUESTION_TYPE_VISUALS: Record<QuestionType, QuestionTypeVisual> = {
  text: { Icon: Type, color: "#3b82f6", marker: "T" },
  multiple_choice: { Icon: List, color: "#06b6d4", marker: "ABC" },
  number: { Icon: Hash, color: "#ec4899", marker: "123" },
  date: { Icon: Calendar, color: "#4f46e5", marker: "DATE" },
  phone: { Icon: Phone, color: "#a855f7", marker: "TEL" },
  email: { Icon: Mail, color: "#f97316", marker: "@" },
  url: { Icon: Link, color: "#f59e0b", marker: "URL" },
  rating: { Icon: Star, color: "#eab308", marker: "5" },
  location: { Icon: MapPin, color: "#10b981", marker: "PIN" },
};

export function getQuestionTypeVisual(type: string | null | undefined) {
  return QUESTION_TYPE_VISUALS[(type as QuestionType) || "text"] ?? QUESTION_TYPE_VISUALS.text;
}

export function getQuestionTypeMarker(type: string | null | undefined, fallback = "T") {
  return QUESTION_TYPE_VISUALS[type as QuestionType]?.marker ?? fallback;
}

export function toQuestionTypeIconOption(option: { value: QuestionType; label: string }): IconSelectOption {
  const visual = getQuestionTypeVisual(option.value);

  return {
    ...option,
    icon: <visual.Icon size={18} style={{ color: visual.color }} />,
  };
}
