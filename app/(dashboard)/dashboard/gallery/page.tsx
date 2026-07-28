import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import GalleryWorkspace from '@/components/dashboard/GalleryWorkspace';

export default async function GalleryPage() {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: causes } = await supabase
    .from('causes')
    .select('id, title, media_url, created_at, status')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  const galleryItems = (causes || [])
    .filter(c => c.media_url && c.media_url.trim() !== '')
    .map(c => ({
      id: c.id,
      title: c.title || 'Recurso subido',
      media_url: c.media_url,
      created_at: c.created_at,
      status: c.status,
    }));

  return <GalleryWorkspace initialItems={galleryItems} />;
}
}
