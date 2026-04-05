import Link from "next/link";
import type { Company } from "@/shared/types/customer";

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({
  company,
}: CompanyCardProps): React.ReactElement {
  const linkTarget = company.slug || company.id;
  return (
    <Link
      href={`/customer/${linkTarget}`}
      className="block rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {company.name}
          </h2>
          <p className="mt-1 text-sm text-muted">{company.description}</p>
          <p className="mt-2 text-xs text-muted">
            <i className="fas fa-location-dot mr-1 text-primary" aria-hidden />
            {company.address}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-foreground">
            {company.cuisine}
          </span>
          <span className="text-xs text-muted">
            <i className="fas fa-clock mr-1" aria-hidden />
            ~{company.deliveryEtaMin} мин
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-primary">
        Меню
        <i className="fas fa-chevron-right ml-2 text-xs" aria-hidden />
      </p>
    </Link>
  );
}
