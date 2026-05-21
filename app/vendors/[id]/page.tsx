import React from 'react';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

type Props = { params: { id: string } };

export default async function VendorIdRedirect({ params }: Props) {
  await connectDB();
  const vendor = (await User.findById(params.id).lean()) as any;
  if (!vendor) return redirect('/');
  if (vendor.slug) {
    return redirect(`/shop/${vendor.slug}`);
  }

  // fallback to vendors page if no slug
  return redirect(`/vendors/${params.id}`);
}
