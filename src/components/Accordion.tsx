import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './ui';

export function Accordion({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // A collapsed panel must not take keyboard focus.
  useEffect(() => {
    bodyRef.current?.toggleAttribute('inert', !open);
  }, [open]);

  return (
    <section className={`acc${open ? ' is-open' : ''}`}>
      <button type="button" className="acc__head" aria-expanded={open} onClick={onToggle}>
        <span className="acc__titles">
          <span className="acc__title">{title}</span>
          {subtitle && <span className="acc__subtitle">{subtitle}</span>}
        </span>
        <Icon name="chevron" size={18} className="acc__chevron" />
      </button>
      <div className="acc__body" ref={bodyRef} aria-hidden={!open}>
        <div className="acc__inner">{children}</div>
      </div>
    </section>
  );
}
