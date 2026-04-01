interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl space-y-2.5">
        <h1 className="font-heading text-3xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-[2.45rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
