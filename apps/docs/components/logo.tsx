import type { SVGProps } from 'react';

/** JackpotKit mark: a wheel with eight spokes, drawn inline so no image request is needed. */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 64 64" {...props}>
      <rect fill="#800020" height="64" rx="16" width="64" />
      <circle cx="32" cy="32" r="20" stroke="#f7edb9" strokeWidth="5" />
      <path
        d="M32 12v40M12 32h40M18 18l28 28M46 18 18 46"
        stroke="#d7707c"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="32" fill="#fffdd0" r="5" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark className="size-6" />
      JackpotKit
    </span>
  );
}
