import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, Car, CheckCircle } from "lucide-react";
import logoImage from "@/assets/logo-crsapp.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Vérifier si nous avons un token valide
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidToken(true);
      } else {
        toast({
          title: "Lien invalide ou expiré",
          description: "Veuillez demander un nouveau lien de réinitialisation.",
          variant: "destructive"
        });
        setTimeout(() => navigate("/auth/forgot-password"), 2000);
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ 
      password: password 
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      setTimeout(() => navigate("/auth"), 2000);
    }

    setLoading(false);
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification du lien...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#c01533] to-[#8a0f24] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 border-2 border-white rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 border-2 border-white rotate-45"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <h2 className="text-4xl font-bold mb-4 text-center animate-fade-in delay-200">
            Car Rental System
          </h2>
          <p className="text-xl text-white/90 mb-12 text-center animate-fade-in delay-300">
            Sécurisez votre compte avec un nouveau mot de passe
          </p>

          <div className="flex gap-12 mt-8">
            <div className="animate-[float_3s_ease-in-out_infinite]">
              <Car className="w-16 h-16 text-white/80" />
            </div>
            <div className="animate-[float_3s_ease-in-out_infinite_0.5s]">
              <Car className="w-16 h-16 text-white/80" />
            </div>
            <div className="animate-[float_3s_ease-in-out_infinite_1s]">
              <Car className="w-16 h-16 text-white/80" />
            </div>
          </div>

          <div className="mt-16 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full animate-fade-in delay-500">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Protection maximale de vos données</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border shadow-lg">
            <CardContent className="pt-8">
              <div className="flex justify-center mb-6">
                <img src={logoImage} alt="CRSApp Logo" className="w-40 h-auto" />
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Réinitialiser votre mot de passe
                </h1>
                <p className="text-muted-foreground">
                  Saisissez votre nouvelle clé d'accès sécurisée
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-[#c01533]" />
                <span>Minimum 8 caractères requis</span>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#c01533] transition-colors" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={8}
                      className="pl-11 h-12 border-input focus:border-[#c01533] transition-all duration-300 hover:border-[#c01533]/50" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative group">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#c01533] transition-colors" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      minLength={8}
                      className="pl-11 h-12 border-input focus:border-[#c01533] transition-all duration-300 hover:border-[#c01533]/50" 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#c01533] hover:bg-[#8a0f24] text-white font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2025 crsapp. Tous droits réservés.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
