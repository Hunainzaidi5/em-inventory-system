import { ReactNode } from 'react';
import { BackButton } from '@/components/common/BackButton';

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  onBack?: () => void;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  backTo, 
  onBack, 
  children, 
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to={backTo} onClick={onBack} />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
      {description && (
        <p className="text-muted-foreground text-sm pl-[52px]">
          {description}
        </p>
      )}
    </div>
  );
}

export default PageHeader;
