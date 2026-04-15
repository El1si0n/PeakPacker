import React, { isValidElement, cloneElement } from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-grow py-20 text-[var(--text-muted)] text-center px-4">
      {isValidElement(icon) 
        ? cloneElement(icon as React.ReactElement, { 
            size: 48, 
            className: "mb-6 opacity-20" 
          }) 
        : <div className="mb-6 opacity-20 transform scale-150">{icon}</div>}
      <h3 className="text-xl font-medium mb-2 text-[var(--text-color)]">{title}</h3>
      <p className="max-w-sm mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
