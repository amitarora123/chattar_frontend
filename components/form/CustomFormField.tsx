import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SelectOption {
  label: string;
  value: string;
}

interface CustomFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string | React.ReactNode;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "number" | "select";
  disabled?: boolean;
  options?: SelectOption[];
}

const CustomFormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled = false,
  options = [],
}: CustomFormFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

          {type === "password" ? (
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={showPassword ? "text" : "password"}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                autoComplete="off"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute cursor-pointer right-3 top-0 h-full flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          ) : type === "select" ? (
            <Select
              key={field.value}
              value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger id={field.name} className="w-full" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              {...field}
              id={field.name}
              type={type}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              autoComplete="off"
              disabled={disabled}
            />
          )}

          {description ? <FieldDescription>{description}</FieldDescription> : null}

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default CustomFormField;
