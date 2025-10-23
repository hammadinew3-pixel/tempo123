import { supabase } from "@/integrations/supabase/client";

/**
 * Download a file from Supabase Storage with automatic extension detection
 * @param url - The full URL of the file in Supabase Storage
 * @param baseFilename - Optional base filename (without extension). If not provided, uses filename from URL
 * @returns Promise that resolves when download is complete
 */
export const downloadFromSupabase = async (url: string, baseFilename?: string): Promise<void> => {
  let bucketName: string;
  let filePath: string;
  
  // Case 1: Full URL (old system with public bucket or signed URL)
  if (url.includes('/storage/v1/object/')) {
    const publicParts = url.split('/storage/v1/object/public/');
    if (publicParts.length >= 2) {
      // Public URL format
      const pathParts = publicParts[1].split('/');
      bucketName = pathParts[0];
      filePath = pathParts.slice(1).join('/');
    } else {
      // Signed URL format
      const signedParts = url.split('/storage/v1/object/sign/');
      if (signedParts.length >= 2) {
        const pathParts = signedParts[1].split('?')[0].split('/');
        bucketName = pathParts[0];
        filePath = pathParts.slice(1).join('/');
      } else {
        throw new Error('URL invalide');
      }
    }
  } 
  // Case 2: Relative path (new system with private bucket)
  else {
    const pathParts = url.split('/');
    bucketName = pathParts[0];
    filePath = pathParts.slice(1).join('/');
  }
  
  if (!bucketName || !filePath) {
    throw new Error('Chemin de fichier invalide');
  }
  
  // Download the file from Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  
  if (error) {
    throw error;
  }
  
  if (!data) {
    throw new Error('Fichier introuvable');
  }
  
  // Determine correct file extension from MIME type or path
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };
  
  const pathExt = filePath.includes('.') ? filePath.split('.').pop()! : '';
  const inferredExt = mimeToExt[data.type] || pathExt || 'bin';
  const baseNameFromPath = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'document';
  const baseName = baseFilename ? baseFilename.replace(/\.[^/.]+$/, '') : baseNameFromPath;
  const finalName = `${baseName}.${inferredExt}`;
  
  // Create a download link
  const downloadUrl = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
