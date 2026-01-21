import Layout from '@/components/Layout';
import Map from '@/components/Map';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  // TODO: Replace with actual check for places count from database
  const hasPlaces = false;

  return (
    <Layout>
      <Map />
      {!hasPlaces && <EmptyState />}
    </Layout>
  );
}
