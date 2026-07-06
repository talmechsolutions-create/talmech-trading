import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findTmisMetal, tmisMetalRecords } from '@/data/tmis';
import TmisMetalProfilePage from '@/components/tmis/TmisMetalProfilePage';

type TmisMetalDetailPageProps = {
  params: { metalSlug: string };
};

export function generateStaticParams() {
  return tmisMetalRecords.map((metal) => ({ metalSlug: metal.slug }));
}

export function generateMetadata({ params }: TmisMetalDetailPageProps): Metadata {
  const metal = findTmisMetal(params.metalSlug);
  if (!metal) {
    return {
      title: 'TMIS Metal Intelligence',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${metal.metal_name} Metal Intelligence | TMIS Draft Profile`,
    description: metal.short_description,
    alternates: { canonical: `/tmis/metals/${metal.slug}` },
  };
}

export default function TmisMetalDetailPage({ params }: TmisMetalDetailPageProps) {
  const metal = findTmisMetal(params.metalSlug);
  if (!metal) notFound();
  return <TmisMetalProfilePage metal={metal} />;
}
