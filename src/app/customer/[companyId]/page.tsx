import Link from "next/link";
import { notFound } from "next/navigation";
import SiteContentContainer from "@/components/layout/site-content-container";
import { getCompanyById } from "@/lib/mock-companies";
import type { MenuItem } from "@/shared/types/customer";

interface CompanyMenuPageProps {
  params: Promise<{ companyId: string }>;
}

function groupByCategory(items: MenuItem[]): Map<string, MenuItem[]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

export default async function CompanyMenuPage({
  params,
}: CompanyMenuPageProps): Promise<React.ReactElement> {
  const { companyId } = await params;
  const company = getCompanyById(companyId);
  if (!company) {
    notFound();
  }
  const grouped = groupByCategory(company.menu);

  return (
    <main className="flex-1 pb-8 pt-20">
      <SiteContentContainer>
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/customer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <i className="fas fa-arrow-left" aria-hidden />
            К заведениям
          </Link>
          <header className="mt-4 border-b border-border-soft pb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {company.name}
            </h1>
            <p className="mt-2 text-muted">{company.description}</p>
            <p className="mt-2 text-sm text-muted">
              <i className="fas fa-location-dot mr-1 text-primary" aria-hidden />
              {company.address}
            </p>
          </header>
          <div className="mt-6 flex flex-col gap-8">
            {[...grouped.entries()].map(([category, items]) => (
              <section key={category}>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {category}
                </h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {item.name}
                          </h3>
                          {item.description ? (
                            <p className="mt-1 text-sm text-muted">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-lg font-semibold text-primary">
                          {item.price} ₽
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </SiteContentContainer>
    </main>
  );
}
