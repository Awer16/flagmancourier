"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import CompanyMenuShop from "@/components/customer/company-menu-shop";
import SiteContentContainer from "@/components/layout/site-content-container";
import { customerApi } from "@/lib/api-client";
import type { BackendCompany } from "@/lib/api-client";

export default function CompanyMenuPage(): React.ReactElement {
  const params = useParams();
  const companyId = params?.companyId as string;
  const [company, setCompany] = useState<BackendCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);

    // Try as UUID first, then as slug
    customerApi
      .getCompany(companyId)
      .then((data) => {
        setCompany(data);
        setLoading(false);
      })
      .catch(() => {
        // Try as slug
        customerApi
          .getCompanyBySlug(companyId)
          .then((data) => {
            setCompany(data);
            setLoading(false);
          })
          .catch(() => {
            setCompany(null);
            setLoading(false);
          });
      });
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <i className="fas fa-spinner fa-spin text-3xl text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-3xl text-red-400" />
          <p className="mt-3 text-muted">Заведение не найдено</p>
          <Link href="/customer" className="mt-4 inline-block text-primary hover:underline">
            ← На главную
          </Link>
        </div>
      </div>
    );
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
            <p className="mt-2 text-muted">{company.description || ""}</p>
            <p className="mt-2 text-sm text-muted">
              <i className="fas fa-location-dot mr-1 text-primary" aria-hidden />
              {company.address || "Адрес не указан"}
            </p>
          </header>
          <div className="mt-6">
            <CompanyMenuShop companyId={company.id} companyName={company.name} />
          </div>
        </div>
      </SiteContentContainer>
    </main>
  );
}
