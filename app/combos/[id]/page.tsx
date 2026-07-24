import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Combo from '@/lib/models/Combo';
import ComboDetailClient from './ComboDetailClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return {};
  try {
    await connectDB();
    const combo = await Combo.findById(id).lean() as any;
    if (!combo) return {};
    const url = `https://neoblue.in/combos/${combo._id}`;
    const title = `${combo.name} - Combo Bundle | NeoBlue`;
    const desc = `${combo.description} Get ${combo.products.length} premium specimens at ₹${combo.price}${combo.originalPrice ? ` (save ₹${combo.originalPrice - combo.price})` : ''}. Live-arrival guaranteed.`;
    return {
      title,
      description: desc.slice(0, 155) + '...',
      keywords: [combo.name, 'aquarium combo', 'fish bundle', 'NeoBlue deal', 'live fish pack'],
      alternates: { canonical: url },
      openGraph: {
        title,
        description: desc.slice(0, 155),
        url,
        images: combo.coverImage ? [{ url: combo.coverImage }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: desc.slice(0, 155),
        images: combo.coverImage ? [combo.coverImage] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function ComboDetailPage({ params }: Props) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const combo = await Combo.findOne({ _id: id, isActive: true })
    .populate('products.productId', 'title price images category waterType scientific vendorId inStock approvalStatus')
    .lean() as any;

  if (!combo) notFound();

  // JSON-LD structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: combo.name,
    description: combo.description,
    image: combo.coverImage,
    offers: {
      '@type': 'Offer',
      url: `https://neoblue.in/combos/${combo._id}`,
      priceCurrency: 'INR',
      price: combo.price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ComboDetailClient combo={JSON.parse(JSON.stringify(combo))} />
    </>
  );
}
