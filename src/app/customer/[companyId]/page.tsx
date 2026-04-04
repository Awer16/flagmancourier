import Link from "next/link";
import { notFound } from "next/navigation";
import CompanyMenuShop from "@/components/customer/company-menu-shop";
import SiteContentContainer from "@/components/layout/site-content-container";
import { getCompanyById } from "@/lib/mock-companies";

interface CompanyMenuPageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyMenuPage({
  params,
}: CompanyMenuPageProps): Promise<React.ReactElement> {
  const { companyId } = await params;
  const company = getCompanyById(companyId);
  if (!company) {
    notFound();
  }

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
          <div className="mt-6">
            <CompanyMenuShop menu={company.menu} />
          </div>
        </div>
      </SiteContentContainer>
    </main>
  );
}
