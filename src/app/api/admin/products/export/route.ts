import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const idsParam = request.nextUrl.searchParams.get('ids');
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : null;

  const products = await prisma.product.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { variants: { orderBy: { sortOrder: 'asc' } } },
  });

  const rows = products.map((p) => ({
    'Název (CS)': p.nameCs,
    Foto: p.imageUrls[0] ?? '',
    'Name (EN)': p.nameEn,
    'Popis (CS)': p.descriptionCs,
    'Description (EN)': p.descriptionEn,
    Kategorie: p.category,
    'Cena (Kč)': p.priceCzk / 100,
    Varianty: p.variants.map((v) => `${v.label}: ${(v.priceCzk / 100).toFixed(0)} Kč`).join(', '),
    Aktivní: p.active ? 'Ano' : 'Ne',
    'Na hlavní stránce': p.featuredOnHome ? 'Ano' : 'Ne',
    Vytvořeno: p.createdAt.toISOString().slice(0, 10),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 30 }, // Název (CS)
    { wch: 40 }, // Foto
    { wch: 30 }, // Name (EN)
    { wch: 50 }, // Popis (CS)
    { wch: 50 }, // Description (EN)
    { wch: 14 }, // Kategorie
    { wch: 10 }, // Cena
    { wch: 40 }, // Varianty
    { wch: 8 }, // Aktivní
    { wch: 16 }, // Na hlavní stránce
    { wch: 12 }, // Vytvořeno
  ];

  // Make the Foto column (column B) a clickable hyperlink to the actual photo
  products.forEach((p, i) => {
    const url = p.imageUrls[0];
    if (!url) return;
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 1 });
    const cell = worksheet[cellRef];
    if (cell) cell.l = { Target: url };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const filename = `navazano-katalog-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
