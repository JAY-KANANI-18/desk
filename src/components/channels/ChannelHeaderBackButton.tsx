import { ArrowLeft } from 'lucide-react';

import { IconButton } from '../ui/button/IconButton';

export const ChannelHeaderBackButton = ({
  ariaLabel,
  onClick,
}: {
  ariaLabel: string;
  onClick: () => void;
}) => (
  <IconButton
    aria-label={ariaLabel}
    icon={<ArrowLeft size={18} />}
    onClick={onClick}
    variant="ghost"
    size='lg'

  />
);
