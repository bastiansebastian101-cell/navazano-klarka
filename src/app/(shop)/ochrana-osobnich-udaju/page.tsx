import type { Metadata } from 'next';
import { LegalPage, H2 } from '@/components/shop/LegalPage';
import { SELLER, SELLER_ADDRESS } from '@/lib/seller';

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů — Navázáno by Klára',
  description: 'Jak e-shop navazano.cz zpracovává osobní údaje zákazníků (GDPR).',
};

const UPDATED = '15. 11. 2026';

export default function PrivacyPage() {
  const mail = (
    <a href={`mailto:${SELLER.email}`} className="text-brand">
      {SELLER.email}
    </a>
  );

  return (
    <LegalPage title="Ochrana osobních údajů" updated={UPDATED}>
      <H2>1. Správce osobních údajů</H2>
      <p>
        Správcem je <strong>{SELLER.legalName}</strong>, IČO {SELLER.ico}, místo podnikání {SELLER_ADDRESS}, provozovatel
        e-shopu {SELLER.web} ({SELLER.shopName}). Kontakt: {mail}, {SELLER.phone}.
      </p>

      <H2>2. Jaké údaje zpracováváme a proč</H2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Vyřízení objednávky</strong> — jméno, e-mail, telefon, doručovací adresa, obsah objednávky, termín
          doručení, způsob platby a případná poznámka. Právní základ: plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR).
        </li>
        <li>
          <strong>Účetnictví a daně</strong> — údaje o objednávce a platbě. Právní základ: plnění právní povinnosti (čl. 6
          odst. 1 písm. c) GDPR).
        </li>
        <li>
          <strong>Zákaznický účet</strong> — e-mail, jméno, telefon a historie objednávek, aby si zákazník mohl objednávky
          zobrazit. Právní základ: plnění smlouvy.
        </li>
        <li>
          <strong>Kytice na míru</strong> — údaje z poptávkového formuláře včetně případné nahrané fotografie. Právní
          základ: jednání o uzavření smlouvy.
        </li>
        <li>
          <strong>Připomenutí příležitosti a žádost o recenzi</strong> — pokud v objednávce uvedete příležitost (např.
          narozeniny), můžeme vám před ní za rok poslat připomínku; po doručení vás můžeme požádat o recenzi. Právní
          základ: oprávněný zájem (přímý marketing vůči stávajícím zákazníkům). Tyto e-maily můžete kdykoli odmítnout
          odpovědí na {mail}.
        </li>
        <li>
          <strong>Měření návštěvnosti</strong> — anonymizované údaje o používání webu (Google Analytics), abychom web
          zlepšovali.
        </li>
      </ul>

      <H2>3. Komu údaje předáváme</H2>
      <p>Údaje zpracovávají pouze tito zpracovatelé, a to jen v rozsahu nutném pro jejich službu:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Vercel Inc. — provoz webu a ukládání nahraných fotografií</li>
        <li>Neon Inc. — databáze (servery v EU)</li>
        <li>Resend (Plus Five Five, Inc.) — odesílání e-mailů</li>
        <li>GOPAY s.r.o. — platby kartou, Google Pay a Apple Pay (pokud tuto platbu zvolíte)</li>
        <li>Google Ireland Ltd. — Google Analytics</li>
      </ul>
      <p>
        Někteří zpracovatelé sídlí v USA; předávání probíhá na základě rámce EU–USA pro ochranu osobních údajů (Data
        Privacy Framework) nebo standardních smluvních doložek. Údaje neprodáváme a nepředáváme dalším osobám.
      </p>

      <H2>4. Jak dlouho údaje uchováváme</H2>
      <p>
        Údaje o objednávkách uchováváme po dobu vyžadovanou daňovými a účetními předpisy (zpravidla 10 let). Zákaznický
        účet uchováváme, dokud nepožádáte o jeho zrušení. Poptávky kytic na míru, které nevedly k objednávce, mažeme
        nejpozději do 1 roku.
      </p>

      <H2>5. Vaše práva</H2>
      <p>
        Máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a právo vznést
        námitku proti zpracování založenému na oprávněném zájmu. Žádosti posílejte na {mail}; vyřídíme je do 1 měsíce.
      </p>
      <p>
        Máte také právo podat stížnost u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7,{' '}
        <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer" className="text-brand">
          uoou.gov.cz
        </a>
        .
      </p>

      <H2>6. Cookies</H2>
      <p>
        Web používá nezbytné cookies (přihlášení k účtu, košík je uložen ve vašem prohlížeči) a cookies Google Analytics
        pro měření návštěvnosti. Cookies můžete kdykoli smazat nebo zablokovat v nastavení prohlížeče.
      </p>
    </LegalPage>
  );
}
