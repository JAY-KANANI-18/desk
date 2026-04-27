import {
  forwardRef,
  type TextareaHTMLAttributes,
} from "react";
import {
  TextareaInput,
  type TextareaInputProps,
} from "./inputs/TextareaInput";

export interface TextareaProps
  extends Omit<TextareaInputProps, "hint">,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ helperText, ...props }, ref) => (
    <TextareaInput {...props} ref={ref} hint={helperText} />
  ),
);

Textarea.displayName = "Textarea";
