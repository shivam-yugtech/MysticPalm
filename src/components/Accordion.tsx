import type { ReactNode } from 'react';
import { Icon } from './ui';

export function Accordion({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`acc${open ? ' is-open' : ''}`}>
      <button type="button" className="acc__head" aria-expanded={open} onClick={onToggle}>
        <span className="acc__titles">
          <span className="acc__title">{title}</span>
          {subtitle && <span className="acc__subtitle">{subtitle}</span>}
        </span>
        <Icon name="chevron" size={18} className="acc__chevron" />
      </button>
      <div className="acc__body" aria-hidden={!open}>
        <div className="acc__inner">{children}</div>
      </div>
    </section>
  );
}
