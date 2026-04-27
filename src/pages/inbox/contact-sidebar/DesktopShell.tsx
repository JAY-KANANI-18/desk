import type { ReactNode } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import { IconButton } from '../../../components/ui/button/IconButton';

interface ContactSidebarDesktopShellProps {
  children: ReactNode;
  headerContent?: ReactNode;
  onClose?: () => void;
  variant?: 'inline' | 'floating';
  containerClassName?: string;
}

export const CONTACT_SIDEBAR_WIDTH = 292;

export function ContactSidebarDesktopShell({
  children,
  headerContent,
  onClose,
  variant = 'inline',
  containerClassName,
}: ContactSidebarDesktopShellProps) {
  const hasHeader = Boolean(headerContent);
  const wrapperClassName = containerClassName ?? (variant === 'floating'
    ? 'absolute inset-y-0 right-0 z-30 hidden md:flex'
    : 'hidden xl:flex');

  const renderCloseButton = () =>
    onClose ? (
      <Tooltip content="Collapse contact details">
        <span className="inline-flex">
          <IconButton
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Collapse contact details"
            icon={<PanelLeftOpen size={18} />}
          />
        </span>
      </Tooltip>
    ) : null;

  return (
    <aside className={wrapperClassName}>
      <div
        className={`relative flex h-full flex-col overflow-hidden border-l bg-white transition-[width,box-shadow] duration-300 ease-out ${
          variant === 'floating' ? 'shadow-[-18px_0_48px_rgba(15,23,42,0.12)]' : ''
        }`}
        style={{
          borderColor: '#edf0f8',
          width: CONTACT_SIDEBAR_WIDTH,
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {onClose ? (
          <div className="absolute left-3 top-3 z-20">
            {renderCloseButton()}
          </div>
        ) : null}

        {hasHeader ? (
          <div className={`border-b border-[#edf0f8] py-4 pr-4 ${onClose ? 'pl-16' : 'px-4'}`}>
            <div className="min-w-0">{headerContent}</div>
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="h-full">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
