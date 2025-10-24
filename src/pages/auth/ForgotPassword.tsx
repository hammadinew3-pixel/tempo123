import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Shield, Car } from "lucide-react";
import logoImage from "@/assets/logo-crsapp.png";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.crsapp.ma/auth/reset-password'
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email."
      });
    }

    setLoading(false);
  };

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
            Récupération sécurisée de votre accès
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
            <span className="text-sm font-medium">Sécurité maximale garantie</span>
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
                  Mot de passe oublié?
                </h1>
                <p className="text-muted-foreground">
                  {emailSent 
                    ? "Consultez votre boîte email" 
                    : "Saisissez votre email pour réinitialiser"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-[#c01533]" />
                <span>Processus sécurisé</span>
              </div>

              {emailSent ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-800">
                      Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                      Veuillez vérifier votre boîte de réception et suivre les instructions.
                    </p>
                  </div>
                  
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-[#c01533] text-[#c01533] hover:bg-[#c01533] hover:text-white transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Adresse email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#c01533] transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="votre@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
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
                        Envoi en cours...
                      </>
                    ) : (
                      "Réinitialiser mon mot de passe"
                    )}
                  </Button>

                  <Link to="/auth">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full h-12 border-input hover:bg-accent transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Retour à la connexion
                    </Button>
                  </Link>
                </form>
              )}
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
