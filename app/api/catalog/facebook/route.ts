import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

const sanitizeXml = (str: string) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const sanitizeCsv = (str: string) => {
  if (!str) return '""';
  const clean = str.replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, ' ');
  return `"${clean}"`;
};

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xml';

    // Fetch all approved products
    const products = await Product.find({ approvalStatus: 'approved' })
      .populate('vendorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const siteUrl = 'https://neoblue.in';

    // CSV format for Meta Commerce Manager
    if (format === 'csv') {
      const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'additional_image_link',
        'brand',
        'google_product_category',
        'fb_product_category',
        'product_type',
        'custom_label_0',
        'custom_label_1',
        'custom_label_2',
      ].join(',');

      const rows = products.map((product: any) => {
        const id = product._id.toString();
        const title = product.title || 'Aquatic Specimen';
        const description = (product.quickOverview || product.description || title).replace(/(\r\n|\n|\r)/gm, ' ');
        const availability = product.inStock ? 'in stock' : 'out of stock';
        const condition = 'new';
        const price = `${Number(product.price || 0).toFixed(2)} INR`;
        const link = `${siteUrl}/products/${id}`;
        const mainImage = product.images?.[0] || `${siteUrl}/logo.png`;
        const additionalImages = Array.isArray(product.images) && product.images.length > 1
          ? product.images.slice(1, 10).join(',')
          : '';
        const brand = product.vendorId?.name || 'NeoBlue';
        const isPlants = product.category === 'Plants';
        const googleCat = isPlants ? 'Home & Garden > Plants' : 'Animals & Pet Supplies > Pet Supplies > Fish Supplies';
        const productType = `${product.category || 'Aquatic'} > ${product.subcategory || 'General'}`;
        const mode = isPlants ? 'plants' : 'fishes';
        const category = product.category || 'General';
        const waterType = product.waterType || 'Freshwater';

        return [
          sanitizeCsv(id),
          sanitizeCsv(title),
          sanitizeCsv(description),
          sanitizeCsv(availability),
          sanitizeCsv(condition),
          sanitizeCsv(price),
          sanitizeCsv(link),
          sanitizeCsv(mainImage),
          sanitizeCsv(additionalImages),
          sanitizeCsv(brand),
          sanitizeCsv(googleCat),
          sanitizeCsv(googleCat),
          sanitizeCsv(productType),
          sanitizeCsv(mode),
          sanitizeCsv(category),
          sanitizeCsv(waterType),
        ].join(',');
      });

      const csvContent = [headers, ...rows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'inline; filename="facebook-catalog-feed.csv"',
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      });
    }

    // Default: Meta / Google Merchant Standard RSS 2.0 XML Catalog Feed
    const itemsXml = products
      .map((product: any) => {
        const id = product._id.toString();
        const title = sanitizeXml(product.title || 'Aquatic Specimen');
        const description = sanitizeXml(
          (product.quickOverview || product.description || product.title || '').replace(/(\r\n|\n|\r)/gm, ' ')
        );
        const availability = product.inStock ? 'in stock' : 'out of stock';
        const price = `${Number(product.price || 0).toFixed(2)} INR`;
        const link = `${siteUrl}/products/${id}`;
        const mainImage = product.images?.[0] || `${siteUrl}/logo.png`;
        const brand = sanitizeXml(product.vendorId?.name || 'NeoBlue');
        const isPlants = product.category === 'Plants';
        const googleCat = isPlants ? 'Home &amp; Garden &gt; Plants' : 'Animals &amp; Pet Supplies &gt; Pet Supplies &gt; Fish Supplies';
        const productType = sanitizeXml(`${product.category || 'Aquatic'} > ${product.subcategory || 'General'}`);
        const mode = isPlants ? 'plants' : 'fishes';
        const category = sanitizeXml(product.category || 'General');
        const waterType = sanitizeXml(product.waterType || 'Freshwater');

        const additionalImageTags = Array.isArray(product.images) && product.images.length > 1
          ? product.images.slice(1, 10).map((img: string) => `<g:additional_image_link>${sanitizeXml(img)}</g:additional_image_link>`).join('\n        ')
          : '';

        return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${sanitizeXml(mainImage)}</g:image_link>
      ${additionalImageTags}
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:google_product_category>${googleCat}</g:google_product_category>
      <g:product_type>${productType}</g:product_type>
      <g:custom_label_0>${mode}</g:custom_label_0>
      <g:custom_label_1>${category}</g:custom_label_1>
      <g:custom_label_2>${waterType}</g:custom_label_2>
    </item>`;
      })
      .join('\n');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:fb="http://www.facebook.com/2008/fbml">
  <channel>
    <title>NeoBlue Product Catalog Feed</title>
    <link>${siteUrl}</link>
    <description>Live Aquarium Fish, Plants, Shrimp, Snails and Aquatic Products Catalog Feed for Meta Commerce Manager</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Meta Catalog Feed error:', error);
    const message = error instanceof Error ? error.message : 'Error generating catalog feed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
