import { supabase } from "@/integrations/supabase/client";

/**
 * Download a file from Supabase Storage with automatic extension detection
 * @param url - The full URL of the file in Supabase Storage
 * @param baseFilename - Optional base filename (without extension). If not provided, uses filename from URL
 * @returns Promise that resolves when download is complete
 */
export const downloadFromSupabase = async (url: string, baseFilename?: string): Promise<void> => {
  // Extract the file path from the URL
  const urlParts = url.split('/storage/v1/object/public/');
  if (urlParts.length < 2) {
    throw new Error('URL invalide');
  }
  
  const pathParts = urlParts[1].split('/');
  const bucketName = pathParts[0];
  const filePath = pathParts.slice(1).join('/');
  
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
