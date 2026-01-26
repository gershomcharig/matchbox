'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { detectMapsUrl } from '@/lib/maps';
import { extractPlaceFromUrl } from '@/app/actions/places-api';

function ShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing');
  const [message, setMessage] = useState('Processing shared link...');
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function processSharedContent() {
      // Get shared content from URL params
      const title = searchParams.get('title') || '';
      const text = searchParams.get('text') || '';
      const url = searchParams.get('url') || '';

      console.log('[Share Target] Received:', { title, text, url });

      // Find Google Maps URL in any of the shared content
      const combinedContent = `${title} ${text} ${url}`;
      const detection = detectMapsUrl(combinedContent);

      if (!detection.isValid || !detection.url) {
        // Also check if the URL itself is a Google Maps URL
        const urlDetection = detectMapsUrl(url);
        if (!urlDetection.isValid || !urlDetection.url) {
          setStatus('error');
          setMessage('No Google Maps link found in the shared content.');
          setSharedUrl(url || text || title);
          return;
        }
        detection.url = urlDetection.url;
      }

      const mapsUrl = detection.url!;
      setSharedUrl(mapsUrl);

      setMessage('Getting place details...');

      // Use Places API to extract place data
      const result = await extractPlaceFromUrl(mapsUrl);

      if (!result.success || !result.place) {
        setStatus('error');
        if (result.apiKeyConfigured === false) {
          setMessage('Google Maps API key not configured.');
        } else {
          setMessage(result.error || 'Could not extract location from the link.');
        }
        return;
      }

      console.log('[Share] Places API result:', result.place);

      // Build the place data to pass to main app
      const placeData = {
        name: result.place.name,
        address: result.place.address,
        lat: result.place.lat,
        lng: result.place.lng,
        googleMapsUrl: result.place.googleMapsUrl,
      };

      // Store in sessionStorage for the main app to pick up
      sessionStorage.setItem('pendingSharedPlace', JSON.stringify(placeData));

      setStatus('success');
      setMessage('Place found! Redirecting...');

      // Redirect to main app
      setTimeout(() => {
        router.push('/?fromShare=true');
      }, 500);
    }

    processSharedContent();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-amber-500/10 border border-amber-100/50 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${status === 'processing' ? 'bg-amber-100' :
              status === 'success' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
              {status === 'processing' ? (
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
              ) : status === 'success' ? (
                <MapPin className="w-10 h-10 text-green-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-zinc-900 mb-2">
            {status === 'processing' ? 'Processing...' :
              status === 'success' ? 'Place Found!' :
                'Oops!'}
          </h1>

          {/* Message */}
          <p className="text-center text-zinc-600 mb-6">
            {message}
          </p>

          {/* Shared URL display */}
          {sharedUrl && status === 'error' && (
            <div className="bg-zinc-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-zinc-500 mb-1">Shared content:</p>
              <p className="text-sm text-zinc-700 break-all font-mono">
                {sharedUrl.length > 100 ? `${sharedUrl.slice(0, 100)}...` : sharedUrl}
              </p>
            </div>
          )}

          {/* Actions */}
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
              >
                Go to Matchbook
              </button>
              {sharedUrl && (
                <a
                  href={sharedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Original Link
                </a>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="flex justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Branding */}
        <p className="text-center text-amber-700/60 text-sm mt-6">
          Matchbook - Collect places to visit
        </p>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
