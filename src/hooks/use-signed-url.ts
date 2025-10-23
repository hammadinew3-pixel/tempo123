import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour générer des URLs signées temporaires pour des fichiers privés
 * @param path - Chemin du fichier dans le bucket (ex: "clients/123/cin.pdf")
 * @param bucket - Nom du bucket (par défaut "client-documents")
 * @param expiresIn - Durée de validité en secondes (par défaut 3600 = 1h)
 */
export function useSignedUrl(
  path: string | null | undefined,
  bucket: string = 'client-documents',
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const generateSignedUrl = async () => {
      // Réinitialiser les états
      setLoading(true);
      setError(null);
      setSignedUrl(null);

      // Si pas de path, on skip
      if (!path) {
        setLoading(false);
        return;
      }

      try {
        // Nettoyer le path : enlever les URLs publiques si présentes
        let cleanPath = path;
        
        // Si c'est une URL complète, extraire juste le path
        if (path.includes('/storage/v1/object/public/')) {
          cleanPath = path.split(`/storage/v1/object/public/${bucket}/`)[1] || path;
        } else if (path.includes('/storage/v1/object/sign/')) {
          cleanPath = path.split(`/storage/v1/object/sign/${bucket}/`)[1]?.split('?')[0] || path;
        }

        // Générer l'URL signée
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(cleanPath, expiresIn);

        if (signError) throw signError;

        if (isMounted && data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err: any) {
        console.error('Error generating signed URL:', err);
        if (isMounted) {
          setError(err.message || 'Impossible de générer l\'URL signée');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [path, bucket, expiresIn]);

  return { signedUrl, loading, error };
}
