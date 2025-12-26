'use client';

import React, { ReactNode } from 'react';
import InfoTooltip from '@/components/InfoTooltip';

interface MetricCardHeaderProps {
  title: string;
  tooltipTitle?: string;
  tooltipContent?: ReactNode;
  children?: ReactNode;
}

const MetricCardHeader: React.FC<MetricCardHeaderProps> = ({
  title,
  tooltipTitle,
  tooltipContent,
  children,
}) => {
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-xl font-semibold text-red-800 flex items-center">
          {title}
          {tooltipTitle && tooltipContent && (
            <InfoTooltip title={tooltipTitle}>{tooltipContent}</InfoTooltip>
          )}
        </h3>
        {children && (
          <div className="flex items-center space-x-2">{children}</div>
        )}
      </div>
    </div>
  );
};

export default MetricCardHeader;
