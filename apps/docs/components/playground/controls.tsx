'use client';

import { deepEqual } from '@/lib/playground/codegen';
import type { ErasedControl, NumberControl } from '@/lib/playground/schema';

import { Button, Checkbox, Field, Select, TextInput } from './ui';

export interface ControlProps<C extends ErasedControl = ErasedControl> {
  readonly control: C;
  /** The explicit value, or `undefined` when the prop is unset. */
  readonly value: unknown;
  /** The value shown when unset: the component's own default. */
  readonly fallback: unknown;
  readonly onChange: (value: unknown) => void;
  /**
   * Colours the component uses for list items without an explicit colour (the active theme's
   * `wheelPalette`, cycled by index), so colour swatches show what is actually drawn.
   */
  readonly paletteFallback?: readonly string[];
}

function clamp(value: number, control: NumberControl): number {
  return Math.min(Math.max(value, control.min), control.max);
}

function NumberInput({ control, fallback, onChange, value }: ControlProps<NumberControl>) {
  const unset = value === undefined;
  const optional = control.optional;
  const shown =
    typeof value === 'number'
      ? value
      : typeof fallback === 'number'
        ? fallback
        : (optional?.fallback ?? control.min);
  const disabled = optional !== undefined && unset;
  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(parsed)) return;
    onChange(clamp(parsed, control));
  };
  return (
    <Field
      hint={control.description ?? (disabled ? optional.fallbackLabel : undefined)}
      label={`${control.label}${control.unit === undefined ? '' : ` (${control.unit})`}`}
    >
      {({ hintId, id }) => (
        <div className="flex flex-col gap-1">
          {optional === undefined ? null : (
            <Checkbox
              checked={!unset}
              label={`Custom ${control.label.toLowerCase()}`}
              onChange={(checked) => onChange(checked ? optional.fallback : undefined)}
            />
          )}
          <div className="flex items-center gap-2">
            <input
              aria-describedby={hintId}
              className="h-9 w-full min-w-0 flex-1 accent-fd-primary"
              disabled={disabled}
              id={id}
              max={control.max}
              min={control.min}
              onChange={(event) => commit(event.currentTarget.value)}
              step={control.step}
              type="range"
              value={shown}
            />
            <div className="w-20 flex-none">
              <TextInput
                aria-label={`${control.label} value`}
                disabled={disabled}
                inputMode="decimal"
                max={control.max}
                min={control.min}
                onChange={(event) => commit(event.currentTarget.value)}
                step={control.step}
                type="number"
                value={shown}
              />
            </div>
          </div>
        </div>
      )}
    </Field>
  );
}

function ListEditor({
  control,
  fallback,
  onChange,
  paletteFallback = [],
  value,
}: ControlProps<Extract<ErasedControl, { kind: 'list' }>>) {
  const items = (
    Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : []
  ) as readonly Record<string, unknown>[];
  const update = (index: number, key: string, next: unknown) =>
    onChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const rest = Object.fromEntries(Object.entries(item).filter(([entry]) => entry !== key));
        return next === undefined ? rest : { ...rest, [key]: next };
      }),
    );
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 sm:col-span-2">
      <legend className="mb-1 text-xs font-medium">
        {control.label} ({items.length})
      </legend>
      {control.description === undefined ? null : (
        <p className="m-0 text-xs text-fd-muted-foreground">{control.description}</p>
      )}
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((item, index) => (
          <li className="rounded-md border p-2" key={index}>
            <fieldset className="grid min-w-0 grid-cols-2 items-end gap-2 sm:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
              <legend className="sr-only">
                {control.itemLabel} {index + 1}
              </legend>
              {control.fields.map((field) => {
                const fieldValue = item[field.key];
                const label = `${control.itemLabel} ${index + 1} ${field.label.toLowerCase()}`;
                if (field.kind === 'toggle')
                  return (
                    <Checkbox
                      aria-label={label}
                      checked={fieldValue === true}
                      key={field.key}
                      label={field.label}
                      onChange={(checked) => update(index, field.key, checked ? true : undefined)}
                    />
                  );
                if (field.kind === 'color')
                  return (
                    <div className="flex min-w-0 flex-col gap-1" key={field.key}>
                      <span aria-hidden="true" className="text-xs font-medium">
                        {field.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          aria-label={label}
                          className="h-9 w-12 flex-none cursor-pointer rounded-md border bg-fd-background p-1"
                          onChange={(event) => update(index, field.key, event.currentTarget.value)}
                          type="color"
                          value={
                            typeof fieldValue === 'string'
                              ? fieldValue
                              : (paletteFallback[index % paletteFallback.length] ?? '#800020')
                          }
                        />
                        {typeof fieldValue === 'string' ? (
                          <Button
                            aria-label={`Clear ${label}`}
                            className="px-2"
                            onClick={() => update(index, field.key, undefined)}
                            variant="ghost"
                          >
                            Clear
                          </Button>
                        ) : (
                          <span className="text-xs text-fd-muted-foreground">Theme</span>
                        )}
                      </div>
                    </div>
                  );
                return (
                  <div className="flex min-w-0 flex-col gap-1" key={field.key}>
                    <span aria-hidden="true" className="text-xs font-medium">
                      {field.label}
                    </span>
                    <TextInput
                      aria-label={label}
                      onChange={(event) => {
                        const raw = event.currentTarget.value;
                        if (field.kind === 'number') {
                          if (raw === '' && field.optional === true) {
                            update(index, field.key, undefined);
                            return;
                          }
                          const parsed = Number(raw);
                          if (Number.isFinite(parsed)) update(index, field.key, parsed);
                          return;
                        }
                        update(
                          index,
                          field.key,
                          raw === '' && field.optional === true ? undefined : raw,
                        );
                      }}
                      placeholder={field.kind === 'number' ? 'default' : undefined}
                      type={field.kind === 'number' ? 'number' : 'text'}
                      {...(field.kind === 'number'
                        ? { max: field.max, min: field.min, step: field.step }
                        : {})}
                      value={
                        typeof fieldValue === 'string' || typeof fieldValue === 'number'
                          ? fieldValue
                          : ''
                      }
                    />
                  </div>
                );
              })}
              <Button
                aria-label={`Remove ${control.itemLabel.toLowerCase()} ${index + 1}`}
                disabled={items.length <= control.minItems}
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </Button>
            </fieldset>
          </li>
        ))}
      </ol>
      <div>
        <Button
          disabled={items.length >= control.maxItems}
          onClick={() => onChange([...items, control.createItem(items.length, items)])}
        >
          Add {control.itemLabel.toLowerCase()}
        </Button>
      </div>
    </fieldset>
  );
}

export function ControlInput(props: ControlProps) {
  const { control, fallback, onChange, value } = props;
  const shown = value ?? fallback;
  switch (control.kind) {
    case 'number':
      return <NumberInput {...props} control={control} />;
    case 'list':
      return <ListEditor {...props} control={control} />;
    case 'select': {
      const index = control.options.findIndex((option) => deepEqual(option.value, shown));
      return (
        <Field hint={control.description} label={control.label}>
          {({ hintId, id }) => (
            <Select
              aria-describedby={hintId}
              id={id}
              onChange={(event) => {
                const option = control.options[Number(event.currentTarget.value)];
                if (option !== undefined) onChange(option.value);
              }}
              value={index === -1 ? '' : String(index)}
            >
              {index === -1 ? <option value="">Library default</option> : null}
              {control.options.map((option, optionIndex) => (
                <option key={option.label} value={optionIndex}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      );
    }
    case 'tristate':
      return (
        <Field hint={control.description} label={control.label}>
          {({ hintId, id }) => (
            <Select
              aria-describedby={hintId}
              id={id}
              onChange={(event) => {
                const next = event.currentTarget.value;
                onChange(next === 'true' ? true : next === 'false' ? false : undefined);
              }}
              value={value === true ? 'true' : value === false ? 'false' : 'unset'}
            >
              <option value="unset">{control.unsetLabel}</option>
              <option value="true">{control.trueLabel}</option>
              <option value="false">{control.falseLabel}</option>
            </Select>
          )}
        </Field>
      );
    case 'toggle':
      return (
        <div className="flex flex-col justify-end">
          <Checkbox checked={shown === true} label={control.label} onChange={onChange} />
        </div>
      );
    case 'text':
      return (
        <Field hint={control.description} label={control.label}>
          {({ hintId, id }) => (
            <TextInput
              aria-describedby={hintId}
              id={id}
              onChange={(event) => onChange(event.currentTarget.value)}
              value={typeof shown === 'string' ? shown : ''}
            />
          )}
        </Field>
      );
    case 'multi': {
      const selected = Array.isArray(shown) ? (shown as readonly unknown[]) : [];
      return (
        <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2">
          <legend className="mb-1 text-xs font-medium">{control.label}</legend>
          <div className="flex flex-wrap gap-x-4">
            {control.options.map((option) => {
              const checked = selected.some((item) => deepEqual(item, option.value));
              return (
                <Checkbox
                  checked={checked}
                  key={option.label}
                  label={option.label}
                  onChange={(next) =>
                    onChange(
                      control.options
                        .filter((candidate) =>
                          candidate === option
                            ? next
                            : selected.some((item) => deepEqual(item, candidate.value)),
                        )
                        .map((candidate) => candidate.value),
                    )
                  }
                />
              );
            })}
          </div>
        </fieldset>
      );
    }
  }
}
