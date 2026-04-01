interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-2">
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground/90">
          Stewardship workspace
        </span>
        <h1 className="font-heading text-3xl leading-none tracking-tight text-foreground sm:text-[2.5rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[0.96rem]">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
