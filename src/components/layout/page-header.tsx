interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em] text-foreground lg:text-[2.45rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 hidden max-w-xl text-sm leading-6 text-muted-foreground lg:block lg:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end lg:gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
