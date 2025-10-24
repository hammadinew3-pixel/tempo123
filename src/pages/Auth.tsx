import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Car, Truck, Bus, Shield, ArrowRight } from "lucide-react";
import logoImage from "@/assets/logo-crsapp.png";

export default function Auth() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue!",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#c01533] to-[#8a0f24] relative overflow-hidden">
        {/* Geometric shapes background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 border-2 border-white rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 border-2 border-white rotate-45"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="animate-fade-in">
            <img 
              src={logoImage} 
              alt="CRSApp Logo" 
              className="w-64 h-auto mb-8 drop-shadow-2xl"
            />
          </div>

          {/* Slogan */}
          <h2 className="text-4xl font-bold mb-4 text-center animate-fade-in delay-200">
            Car Rental System
          </h2>
          <p className="text-xl text-white/90 mb-12 text-center animate-fade-in delay-300">
            Gérez votre flotte en toute simplicité
          </p>

          {/* Floating vehicle icons */}
          <div className="flex gap-12 mt-8">
            <div className="animate-[float_3s_ease-in-out_infinite]">
              <Car className="w-16 h-16 text-white/80" />
            </div>
            <div className="animate-[float_3s_ease-in-out_infinite_0.5s]">
              <Truck className="w-16 h-16 text-white/80" />
            </div>
            <div className="animate-[float_3s_ease-in-out_infinite_1s]">
              <Bus className="w-16 h-16 text-white/80" />
            </div>
          </div>

          {/* Trust badge */}
          <div className="mt-16 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full animate-fade-in delay-500">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">1000+ agences nous font confiance</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border shadow-lg">
            <CardContent className="pt-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src={logoImage} 
                  alt="CRSApp Logo" 
                  className="w-40 h-auto"
                />
              </div>

              {/* Welcome message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Bienvenue
                </h1>
                <p className="text-muted-foreground">
                  Connectez-vous à votre espace
                </p>
              </div>

              {/* Secure login badge */}
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-[#c01533]" />
                <span>Connexion sécurisée</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
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

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Mot de passe
                    </Label>
                    <button
                      type="button"
                      className="text-sm text-[#c01533] hover:text-[#8a0f24] transition-colors hover:underline"
                    >
                      Oublié?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#c01533] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-11 h-12 border-input focus:border-[#c01533] transition-all duration-300 hover:border-[#c01533]/50"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#c01533] hover:bg-[#8a0f24] text-white font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Additional links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Pas encore de compte?{" "}
                  <button className="text-[#c01533] hover:text-[#8a0f24] font-medium hover:underline transition-colors">
                    Contactez-nous
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2024 CRSApp. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
