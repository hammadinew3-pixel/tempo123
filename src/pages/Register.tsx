import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Building2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const planId = searchParams.get('plan');
  const duration = searchParams.get('duration');

  const [formData, setFormData] = useState({
    agencyName: '',
    ice: '',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Inscription de l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            agency_name: formData.agencyName,
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            ice: formData.ice,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erreur lors de la création de l'utilisateur");
      }

      // Attendre un peu pour que le trigger handle_new_user crée le tenant
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Récupérer le tenant_id créé
      const { data: userTenant, error: tenantError } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', authData.user.id)
        .single();

      if (tenantError) throw tenantError;

      // Si plan et duration sont présents, créer la subscription
      if (planId && duration && userTenant) {
        const durationMonths = parseInt(duration);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            tenant_id: userTenant.tenant_id,
            plan_id: planId,
            duration: durationMonths,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            is_active: false,
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (subError) throw subError;

        // Mettre à jour le statut du tenant à "pending_payment"
        await supabase
          .from('tenants')
          .update({ status: 'pending_payment' })
          .eq('id', userTenant.tenant_id);

        toast({
          title: "✅ Inscription réussie",
          description: "Vous allez être redirigé vers la page de paiement",
        });

        navigate(`/paiement?subscription_id=${subscription.id}`);
      } else {
        // Pas de plan sélectionné, laisser le statut "pending_selection"
        toast({
          title: "✅ Inscription réussie",
          description: "Veuillez choisir votre pack",
        });

        navigate('/choisir-pack');
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white border-gray-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-[#c01533]" />
          </div>
          <CardTitle className="text-2xl text-black">Créer votre compte CRSApp</CardTitle>
          <CardDescription className="text-gray-600">
            Rejoignez la plateforme de gestion de location de véhicules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName" className="text-black">Nom de l'agence *</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black"
                  placeholder="Mon Agence de Location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ice" className="text-black">ICE *</Label>
                <Input
                  id="ice"
                  name="ice"
                  value={formData.ice}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black"
                  placeholder="000000000000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-black">Nom *</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-black">Prénom *</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-black">Téléphone *</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 text-black"
                placeholder="+212 6 00 00 00 00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 text-black"
                placeholder="contact@monagence.ma"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black pr-10"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300 text-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c01533] hover:bg-[#9a0f26] text-white"
            >
              {loading ? "Inscription en cours..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-[#c01533] hover:underline font-medium"
              >
                Se connecter
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
