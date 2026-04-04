import type { Metadata } from "next";
import CustomerHeader from "@/components/customer/customer-header";

export const metadata: Metadata = {
  title: "Покупателю",
  description: "Выбор адреса, заведения и меню",
};

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="relative min-h-dvh w-full flex-1 bg-background">
      <CustomerHeader />
      {children}
    </div>
  );
}
