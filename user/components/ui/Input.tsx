import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('ui-input', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('ui-textarea', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn('ui-input', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export { NumberInput, StringNumberInput } from '@/components/ui/NumberInput';
export type { NumberInputProps, StringNumberInputProps } from '@/components/ui/NumberInput';

export const Label = ({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) => (
  <label
    className={cn('mb-1.5 block text-sm font-medium text-[#111827]', className)}
    {...props}
  >
    {children}
    {required ? <span className="ml-0.5 text-[#D32F2F]">*</span> : null}
  </label>
);

export const FieldHint = ({
  className,
  error,
  children,
}: {
  className?: string;
  error?: boolean;
  children: React.ReactNode;
}) => (
  <p
    className={cn(
      'mt-1.5 text-[13px]',
      error ? 'text-[#DC2626]' : 'text-[#6B7280]',
      className,
    )}
  >
    {children}
  </p>
);
