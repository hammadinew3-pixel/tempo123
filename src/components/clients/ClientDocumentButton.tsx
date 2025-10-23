import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignedUrl } from '@/hooks/use-signed-url';
import { useToast } from '@/hooks/use-toast';

interface ClientDocumentButtonProps {
  documentPath: string | null | undefined;
  filename: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ClientDocumentButton({
  documentPath,
  filename,
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
}: ClientDocumentButtonProps) {
  const { signedUrl, loading, error } = useSignedUrl(documentPath);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!signedUrl) {
      toast({
        title: 'Erreur',
        description: error || 'URL du document non disponible',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { downloadFromSupabase } = await import('@/lib/downloadUtils');
      await downloadFromSupabase(signedUrl, filename);
      
      toast({
        title: 'Succès',
        description: 'Document téléchargé',
      });
    } catch (err: any) {
      console.error('Error downloading document:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };

  if (!documentPath) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading || !!error}
      className={className}
    >
      {children || (
        <>
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Chargement...' : 'Télécharger'}
        </>
      )}
    </Button>
  );
}
