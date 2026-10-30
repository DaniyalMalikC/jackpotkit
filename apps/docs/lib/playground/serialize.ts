const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const INDENT = '  ';
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g');

/** A TypeScript string literal in single quotes. */
export function quote(text: string): string {
  return `'${text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(LINE_SEPARATORS, (character) => `\\u${character.charCodeAt(0).toString(16)}`)}'`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

/**
 * Prints a JSON-like value (strings, numbers, booleans, arrays, plain objects) as TypeScript
 * source, close to Prettier's output: short values on one line, longer ones expanded.
 */
export function toSource(value: unknown, depth = 0): string {
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Cannot print the number ${value}.`);
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const items = (value as readonly unknown[]).map((item) => toSource(item, depth + 1));
    return wrap('[', ']', items, depth);
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(
        ([key, entry]) =>
          `${IDENTIFIER.test(key) ? key : quote(key)}: ${toSource(entry, depth + 1)}`,
      );
    if (entries.length === 0) return '{}';
    return wrap('{ ', ' }', entries, depth, '{', '}');
  }
  throw new TypeError(`Cannot print a value of type ${typeof value}.`);
}

function wrap(
  open: string,
  close: string,
  items: readonly string[],
  depth: number,
  openExpanded = open.trim(),
  closeExpanded = close.trim(),
): string {
  const inline = `${open}${items.join(', ')}${close}`;
  if (items.length === 0) return `${open.trim()}${close.trim()}`;
  if (!inline.includes('\n') && inline.length + depth * INDENT.length <= 72) return inline;
  const pad = INDENT.repeat(depth + 1);
  return `${openExpanded}\n${items.map((item) => `${pad}${item},`).join('\n')}\n${INDENT.repeat(depth)}${closeExpanded}`;
}

/**
 * Converts a callback argument to JSON-safe data for the event log: errors keep their name and
 * message, functions and cycles are named, and deep or large values are truncated.
 */
export function toLoggable(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...('code' in value && typeof value.code === 'string' ? { code: value.code } : {}),
      ...(value.cause === undefined ? {} : { cause: toLoggable(value.cause, depth + 1, seen) }),
    };
  }
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth >= 6) return '[…]';
  seen.add(value);
  if (Array.isArray(value)) {
    const items = (value as readonly unknown[])
      .slice(0, 50)
      .map((item) => toLoggable(item, depth + 1, seen));
    return value.length > 50 ? [...items, `… ${value.length - 50} more`] : items;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, toLoggable(entry, depth + 1, seen)]),
  );
}
