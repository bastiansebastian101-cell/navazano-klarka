import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Popups } from '@/components/shop/Popups';
import { DeliveryCountdownBar } from '@/components/shop/DeliveryCountdownBar';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DeliveryCountdownBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Popups />
    </div>
  );
}
