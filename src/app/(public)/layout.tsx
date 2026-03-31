import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";
import { ToastProvider } from "@/components/ui/toast";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <ToastProvider>
        {children}
      </ToastProvider>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
