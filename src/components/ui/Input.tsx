import { forwardRef, type InputHTMLAttributes } from "react";
import { BaseInput, type BaseInputProps } from "./inputs/BaseInput";

export interface InputProps
  extends Omit<BaseInputProps, "hint" | "size">,
    Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  helperText?: string;
  inputSize?: BaseInputProps["size"];
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ helperText, inputSize = "md", ...props }, ref) => (
    <BaseInput {...props} ref={ref} hint={helperText} size={inputSize} />
  ),
);

Input.displayName = "Input";
