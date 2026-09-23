import { historySerif } from "@/fonts/history-fonts";
import {
  PoetsCornerMobileNav,
  PoetsCornerSidebar,
} from "@/components/poets-corner";

export default function PoetsCornerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto flex w-full max-w-site bg-[#f7f1e8] font-sans ${historySerif.variable}`}>
      <PoetsCornerSidebar />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <PoetsCornerMobileNav />
        {children}
      </div>
    </div>
  );
}
