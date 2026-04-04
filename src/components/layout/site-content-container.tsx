interface SiteContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SiteContentContainer({
  children,
  className = "",
}: SiteContentContainerProps): React.ReactElement {
  return (
    <div
      className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
