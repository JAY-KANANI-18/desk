import { ArrowLeft } from 'lucide-react';

import { IconButton } from '../ui/button/IconButton';

export const BackButton = ({
  ariaLabel,
  onClick,
  size = 'lg',
}: {
  ariaLabel: string;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}) => (
  <IconButton
    aria-label={ariaLabel}
    icon={<ArrowLeft size={18} />}
    onClick={onClick}
    variant="ghost"
    size={size}
  />
);
