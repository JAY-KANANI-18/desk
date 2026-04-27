import { Button, type ButtonProps } from '../ui/button/Button';

export const ChannelConnectActionButton = ({
  radius = 'lg',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <Button
    {...props}
    variant={variant}
  />
);
