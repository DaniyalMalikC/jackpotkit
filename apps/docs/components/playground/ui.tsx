'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useId } from 'react';

/**
 * Small shadcn/ui-style primitives built on native form elements, so labels, keyboard support,
 * and focus handling come from the browser.
 */

function cx(...classes: readonly (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-1 focus-visible:ring-offset-fd-background';

export function Button({
  className,
  variant = 'outline',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: 'outline' | 'primary' | 'ghost';
}) {
  return (
    <button
      className={cx(
        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60',
        'motion-safe:transition-colors',
        variant === 'primary' && 'bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90',
        variant === 'outline' &&
          'border bg-fd-background hover:bg-fd-accent hover:text-fd-accent-foreground',
        variant === 'ghost' && 'hover:bg-fd-accent hover:text-fd-accent-foreground',
        focusRing,
        className,
      )}
      type="button"
      {...props}
    />
  );
}

const inputClass = cx(
  'h-9 w-full min-w-0 rounded-md border bg-fd-background px-2 text-sm text-fd-foreground',
  focusRing,
);

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputClass, 'pr-6', className)} {...props} />;
}

/** A label above its control, with an optional hint linked through `aria-describedby`. */
export function Field({
  children,
  hint,
  label,
}: {
  readonly children: (ids: { readonly id: string; readonly hintId?: string }) => ReactNode;
  readonly hint?: ReactNode;
  readonly label: ReactNode;
}) {
  const id = useId();
  const hintId = hint === undefined ? undefined : `${id}-hint`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="text-xs font-medium text-fd-foreground" htmlFor={id}>
        {label}
      </label>
      {children(hintId === undefined ? { id } : { hintId, id })}
      {hint === undefined ? null : (
        <p className="text-xs text-fd-muted-foreground" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  className,
  label,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> & {
  readonly checked: boolean;
  readonly label: ReactNode;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cx('inline-flex min-h-9 items-center gap-2 text-sm', className)}>
      <input
        checked={checked}
        className={cx('size-4 accent-fd-primary', focusRing)}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

/** A segmented radio group. Arrow keys move between options, as with any native radio group. */
export function Segmented<V extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: {
  readonly label: string;
  readonly name: string;
  readonly onChange: (value: V) => void;
  readonly options: readonly { readonly label: string; readonly value: V }[];
  readonly value: V;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 text-xs font-medium">{label}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-fd-muted p-1">
        {options.map((option) => (
          <label
            className={cx(
              'relative inline-flex min-h-8 cursor-pointer items-center rounded-md px-2.5 text-sm',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fd-ring',
              option.value === value
                ? 'bg-fd-background font-medium text-fd-foreground shadow-sm'
                : 'text-fd-muted-foreground hover:text-fd-foreground',
            )}
            key={option.value}
          >
            <input
              checked={option.value === value}
              className="absolute inset-0 m-0 cursor-pointer appearance-none rounded-md opacity-0"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Panel({
  actions,
  children,
  className,
  title,
}: {
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly title: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cx('min-w-0 border-t', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <h3 className="m-0 text-sm font-semibold" id={id}>
          {title}
        </h3>
        {actions === undefined ? null : <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="px-4 pt-2 pb-4">{children}</div>
    </section>
  );
}
