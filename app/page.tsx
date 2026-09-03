import PcBuilder from './pc-builder';

// The route has no request-specific server data; interactive state is client-only.
export const dynamic = 'force-static';

export default function Page() {
  return <PcBuilder />;
}
