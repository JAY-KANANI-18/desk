import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  children: React.ReactNode;
}

export const Badge = ({ variant = 'gray', children, className = '', ...props }: BadgeProps) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    gray: 'badge-gray',
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
