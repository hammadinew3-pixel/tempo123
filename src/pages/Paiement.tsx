import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, CreditCard, Building2, CheckCircle, Calendar, DollarSign } from "lucide-react";

const TVA_PLANS = 20; // TVA fixe pour les abonnements

export default function Paiement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const subscriptionId = searchParams.get('subscription_id');
  const [paymentMethod, setPaymentMethod] = useState<'virement' | 'enligne'>('virement');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const {
    data: subscriptionData,
    isLoading: loadingSub
  } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) throw new Error("ID de souscription manquant");
      const {
        data,
        error
      } = await supabase.from('subscriptions').select(`
          *,
          plan:plans (*),
          tenant:tenants (*)
        `).eq('id', subscriptionId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!subscriptionId
  });
  const {
    data: bankInfo
  } = useQuery({
    queryKey: ['bank-settings'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('settings_bancaires').select('*').single();
      if (error) throw error;
      return data;
    }
  });
  const motif = subscriptionData ? `${subscriptionData.tenant.name.replace(/\s/g, '')}${subscriptionData.duration}moiscrsapp` : '';
  const priceHT = subscriptionData?.plan ? subscriptionData.duration === 6 ? subscriptionData.plan.price_6_months : subscriptionData.plan.price_12_months : 0;
  const priceTTC = Math.round(priceHT * 1.20);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Erreur",
          description: "Seuls les fichiers PDF et images (JPG, PNG) sont acceptés",
          variant: "destructive"
        });
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La taille du fichier ne doit pas dépasser 5 Mo",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };
  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un justificatif de paiement",
        variant: "destructive"
      });
      return;
    }
    if (!subscriptionData) return;
    setUploading(true);
    try {
      // Upload du fichier
      const fileName = `${subscriptionData.tenant_id}_${Date.now()}_${selectedFile.name}`;
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from('payment-proofs').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      // Obtenir l'URL du fichier
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);

      // Mettre à jour la subscription et le tenant via RPC sécurisée
      const {
        error: rpcError
      } = await supabase.rpc('submit_payment_proof', {
        _subscription_id: subscriptionId,
        _proof_url: publicUrl,
        _reference: motif
      });
      if (rpcError) throw rpcError;
      toast({
        title: "✅ Justificatif envoyé",
        description: "Nous validerons votre paiement sous 24 heures."
      });
      navigate('/attente-validation');
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  if (loadingSub) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c01533] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>;
  }
  if (!subscriptionData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">Souscription introuvable.</p>
            <Button onClick={() => navigate('/choisir-pack')} className="mt-4">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>;
  }

  // Affichage conditionnel selon le statut
  const tenantStatus = subscriptionData?.tenant?.status;
  const subscriptionStatus = subscriptionData?.status;
  return <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-2">Finaliser votre abonnement</h1>
          <p className="text-gray-600">
            {subscriptionStatus === 'awaiting_verification' || tenantStatus === 'awaiting_verification' ? 'Votre paiement est en cours de vérification' : 'Dernière étape avant d\'accéder à CRSApp'}
          </p>
        </div>

        {/* Message selon le statut */}
        {(subscriptionStatus === 'awaiting_verification' || tenantStatus === 'awaiting_verification') && <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              ✅ Votre justificatif est en cours de vérification. Vous recevrez un email dès validation (sous 24h).
            </AlertDescription>
          </Alert>}
        
        {(subscriptionStatus === 'awaiting_payment' || tenantStatus === 'pending_payment') && <Alert className="bg-orange-50 border-orange-200">
            <AlertDescription className="text-orange-700">
              💳 Veuillez finaliser votre paiement pour activer votre compte.
            </AlertDescription>
          </Alert>}
        
        {tenantStatus === 'suspended' && <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">
              ⚠️ Votre abonnement est suspendu. Renouvelez-le pour continuer.
            </AlertDescription>
          </Alert>}

        {/* Résumé de la souscription */}
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-black flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#c01533]" />
              Résumé de votre souscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Pack sélectionné</p>
                <p className="font-semibold text-black">{subscriptionData.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durée</p>
                <p className="font-semibold text-black">{subscriptionData.duration} mois</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                <p className="font-semibold text-black flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#c01533]" />
                  {new Date(subscriptionData.start_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="font-semibold text-black flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#c01533]" />
                  {new Date(subscriptionData.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prix HT</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {priceHT} DH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">TVA (20%)</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {Math.round(priceHT * 0.20)} DH
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold text-gray-700">Total à payer TTC</span>
                  <span className="text-3xl font-bold text-[#c01533]">
                    {priceTTC} DH
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode de paiement */}
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-black">Mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
              <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg cursor-not-allowed opacity-50">
                <RadioGroupItem value="enligne" id="enligne" disabled />
                <Label htmlFor="enligne" className="flex items-center gap-2 cursor-not-allowed">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-500">Paiement en ligne</p>
                    <p className="text-xs text-gray-400">Bientôt disponible (Stripe / CMI)</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border-2 border-[#c01533] rounded-lg">
                <RadioGroupItem value="virement" id="virement" />
                <Label htmlFor="virement" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-5 w-5 text-[#c01533]" />
                  <div>
                    <p className="font-medium text-black">Paiement par virement bancaire</p>
                    <p className="text-xs text-gray-600">Validation sous 2 heures</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Informations bancaires */}
        {paymentMethod === 'virement' && bankInfo && <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-black">Coordonnées bancaires</CardTitle>
              <CardDescription className="text-gray-600">
                Effectuez votre virement vers le compte suivant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Banque</p>
                  <p className="font-semibold text-black">{bankInfo.nom_banque}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Titulaire</p>
                  <p className="font-semibold text-black">{bankInfo.titulaire}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">RIB</p>
                  <p className="font-mono font-semibold text-black">{bankInfo.rib}</p>
                </div>
                {bankInfo.swift && <div>
                    <p className="text-sm text-gray-600">SWIFT</p>
                    <p className="font-mono font-semibold text-black">{bankInfo.swift}</p>
                  </div>}
              </div>

              <Alert className="bg-orange-50 border-orange-200">
                <AlertDescription className="text-orange-700">
                  <strong>⚠️ Important :</strong> Indiquez ce motif dans votre virement :
                  <div className="mt-2 p-2 bg-white rounded border border-orange-300">
                    <code className="text-sm font-mono text-black">{motif}</code>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="proof" className="text-black">
                  Justificatif de paiement (PDF ou image)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#c01533] transition-colors">
                  <input id="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="proof" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    {selectedFile ? <p className="text-sm text-black font-medium">{selectedFile.name}</p> : <>
                        <p className="text-sm text-gray-600">Cliquez pour sélectionner un fichier</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG (max 5 Mo)</p>
                      </>}
                  </label>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={!selectedFile || uploading} className="w-full bg-[#c01533] hover:bg-[#9a0f26] text-white">
                {uploading ? "Envoi en cours..." : "Envoyer ma demande"}
              </Button>
            </CardContent>
          </Card>}
      </div>
    </div>;
}