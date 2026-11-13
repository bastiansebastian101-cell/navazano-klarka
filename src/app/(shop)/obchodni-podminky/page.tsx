import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, H2 } from '@/components/shop/LegalPage';
import { SELLER, SELLER_ADDRESS } from '@/lib/seller';
import { ORDER_CUTOFF_HOUR } from '@/lib/delivery';

export const metadata: Metadata = {
  title: 'Obchodní podmínky — Navázáno by Klára',
  description: 'Obchodní podmínky e-shopu navazano.cz — objednávka, platba, doručení, odstoupení od smlouvy a reklamace.',
};

const UPDATED = '15. 11. 2026';

export default function TermsPage() {
  return (
    <LegalPage title="Obchodní podmínky" updated={UPDATED}>
      <H2>1. Prodávající</H2>
      <p>
        Provozovatelem e-shopu <strong>{SELLER.web}</strong> ({SELLER.shopName}) je:
      </p>
      <p className="bg-white rounded-xl shadow-card p-4">
        <strong>{SELLER.legalName}</strong>
        <br />
        IČO: {SELLER.ico}
        {SELLER.vatPayer && (
          <>
            , DIČ: {SELLER.dic}
          </>
        )}
        <br />
        Místo podnikání: {SELLER_ADDRESS}
        <br />
        E-mail: <a href={`mailto:${SELLER.email}`} className="text-brand">{SELLER.email}</a>
        <br />
        Telefon: <a href={`tel:${SELLER.phone.replace(/\s/g, '')}`} className="text-brand">{SELLER.phone}</a>
      </p>
      <p>
        Tyto obchodní podmínky upravují vztahy mezi prodávajícím a kupujícím při nákupu zboží (zejména ručně vázaných
        kytic, květin, rostlin a dárků) prostřednictvím e-shopu {SELLER.web}. Vztahy neupravené těmito podmínkami se
        řídí zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 634/1992 Sb., o ochraně spotřebitele.
      </p>

      <H2>2. Objednávka a uzavření smlouvy</H2>
      <p>
        Kupující vybere zboží v katalogu, vloží jej do košíku a v objednávkovém formuláři vyplní kontaktní údaje,
        doručovací adresu, datum a časové okno doručení a způsob platby. Před odesláním může údaje kdykoli zkontrolovat a
        změnit. Odesláním objednávky kupující potvrzuje, že se seznámil s těmito obchodními podmínkami.
      </p>
      <p>
        Kupní smlouva je uzavřena okamžikem, kdy prodávající kupujícímu potvrdí přijetí objednávky e-mailem. Pokud
        prodávající objednávku nemůže splnit (např. z důvodu nedostupnosti květin), neprodleně kupujícího kontaktuje a
        nabídne náhradní řešení; nedojde-li k dohodě, vrátí kupujícímu případně již uhrazenou cenu v plné výši.
      </p>
      <p>
        Kytice jsou ruční práce z živých květin. Podoba kytice se může od fotografie v katalogu mírně lišit podle
        aktuální nabídky květin; prodávající zachová styl, barevnost a hodnotu kytice.
      </p>

      <H2>3. Ceny</H2>
      <p>
        Ceny zboží jsou uvedeny v Kč {SELLER.vatPayer ? 'včetně DPH' : '(prodávající není plátcem DPH)'}. Doprava v rámci
        oblasti doručení je <strong>zdarma</strong>. Slevové kódy lze uplatnit v objednávce; sleva se odečte z ceny zboží a
        kódy nelze směnit za hotovost.
      </p>

      <H2>4. Platební podmínky</H2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Bankovním převodem</strong> — údaje k platbě (číslo účtu, variabilní symbol = číslo objednávky a QR
          kód) obdrží kupující po odeslání objednávky a v potvrzovacím e-mailu.
        </li>
        <li>
          <strong>Hotově při převzetí</strong> — kupující zaplatí cenu v hotovosti při doručení zboží.
        </li>
        <li>
          <strong>Platební kartou, Google Pay nebo Apple Pay</strong> — je-li tento způsob v objednávce nabízen, platba
          probíhá přes zabezpečenou platební bránu (Comgate nebo GoPay). Prodávající nemá přístup k údajům o platební kartě.
        </li>
      </ul>

      <H2>5. Doručení</H2>
      <p>
        Zboží doručujeme osobně do <strong>Českých Budějovic a blízkého okolí (PSČ 370–373)</strong>, v den a časovém
        okně, které kupující zvolí v objednávce (9:00–12:00, 12:00–15:00 nebo 15:00–18:00). Objednávky přijaté do{' '}
        {ORDER_CUTOFF_HOUR}:00 (českého času) lze doručit nejdříve následující den, pozdější objednávky nejdříve za dva
        dny.
      </p>
      <p>
        Pokud příjemce není v době doručení k zastižení, prodávající jej nebo kupujícího kontaktuje telefonicky a
        dohodne předání (např. náhradní čas nebo osobu, která kytici převezme).
      </p>

      <H2>6. Odstoupení od smlouvy</H2>
      <p>
        Spotřebitel má obecně právo odstoupit od smlouvy uzavřené distančním způsobem do 14 dnů od převzetí zboží.{' '}
        <strong>Toto právo však nelze uplatnit</strong> u zboží, které podléhá rychlé zkáze (živé květiny, kytice,
        řezané rostliny), a u zboží upraveného podle přání kupujícího (např. kytice na míru) — podle § 1837 písm. d) a
        e) občanského zákoníku.
      </p>
      <p>
        U ostatního zboží (např. dárkové předměty) může spotřebitel odstoupit do 14 dnů od převzetí oznámením na e-mail{' '}
        <a href={`mailto:${SELLER.email}`} className="text-brand">{SELLER.email}</a>. Zboží vrátí nepoškozené na adresu
        prodávajícího do 14 dnů od odstoupení; náklady na vrácení nese kupující. Prodávající vrátí přijatou platbu do 14
        dnů od odstoupení stejným způsobem, jakým ji přijal, nejdříve však po vrácení zboží.
      </p>

      <H2>7. Reklamace (práva z vadného plnění)</H2>
      <p>
        Kupující je povinen zboží při převzetí prohlédnout. Protože jde o živé květiny, prosíme, abyste případné vady
        (např. poškození při doručení, zvadlé květy) oznámili <strong>bez zbytečného odkladu, ideálně v den doručení</strong>,
        e-mailem nebo telefonicky, nejlépe s fotografií. U živých květin odpovídá doba, po kterou lze vady uplatnit, jejich
        přirozené trvanlivosti; přirozené vadnutí květin není vadou.
      </p>
      <p>
        Reklamaci vyřídíme bez zbytečného odkladu, nejpozději do 30 dnů od jejího uplatnění — zpravidla doručením nové
        kytice nebo vrácením ceny. O vyřízení informujeme kupujícího e-mailem.
      </p>

      <H2>8. Zákaznický účet</H2>
      <p>
        Při první objednávce se kupujícímu automaticky vytvoří zákaznický účet vázaný na jeho e-mail, ve kterém vidí
        historii objednávek. Přihlášení probíhá odkazem zaslaným na e-mail, bez hesla. Kupující může požádat o zrušení
        účtu na <a href={`mailto:${SELLER.email}`} className="text-brand">{SELLER.email}</a>.
      </p>

      <H2>9. Mimosoudní řešení sporů</H2>
      <p>
        Případné stížnosti řešte prosím nejprve s námi na{' '}
        <a href={`mailto:${SELLER.email}`} className="text-brand">{SELLER.email}</a>. K mimosoudnímu řešení
        spotřebitelských sporů je příslušná Česká obchodní inspekce, Štěpánská 567/15, 120 00 Praha 2,{' '}
        <a href="https://adr.coi.cz" target="_blank" rel="noopener noreferrer" className="text-brand">
          adr.coi.cz
        </a>
        . Dozor nad dodržováním povinností prodávajícího vykonává Česká obchodní inspekce a v rozsahu ochrany osobních
        údajů Úřad pro ochranu osobních údajů.
      </p>

      <H2>10. Ochrana osobních údajů</H2>
      <p>
        Zpracování osobních údajů popisujeme v dokumentu{' '}
        <Link href="/ochrana-osobnich-udaju" className="text-brand">
          Ochrana osobních údajů
        </Link>
        .
      </p>

      <H2>11. Závěrečná ustanovení</H2>
      <p>
        Smlouva se uzavírá v českém jazyce. Prodávající může obchodní podmínky měnit; na již uzavřené smlouvy se použije
        znění účinné v době odeslání objednávky. Tyto obchodní podmínky jsou účinné od {UPDATED}.
      </p>
    </LegalPage>
  );
}
