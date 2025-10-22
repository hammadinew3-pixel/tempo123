import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { z } from "zod";

// Validation schema pour sécuriser les entrées
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email invalide" })
    .max(255, { message: "Email trop long" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .max(100, { message: "Mot de passe trop long" }),
});

export default function LoginSuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // États pour la réinitialisation de mot de passe
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation des entrées
      const validatedData = loginSchema.parse({ email, password });

      // Authentification
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError || !data.user) {
        // Message d'erreur générique pour éviter l'énumération d'utilisateurs
        setError("Identifiants incorrects");
        setLoading(false);
        return;
      }

      // Vérifier le rôle super_admin avec tenant_id = null
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role, tenant_id")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .is("tenant_id", null)
        .maybeSingle();

      if (roleError) {
        setError("Erreur de vérification des permissions");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!userRole) {
        // L'utilisateur n'a pas le rôle super_admin
        setError("Accès refusé. Cette console est réservée aux super administrateurs.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Succès - Redirection vers le dashboard super admin
      navigate("/admin/dashboard");
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Erreur de validation
        setError(err.errors[0].message);
      } else {
        // Erreur générique
        setError("Une erreur s'est produite lors de la connexion");
      }
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setError("");
    setResetLoading(true);

    try {
      const emailSchema = z.string().email("Email invalide");
      emailSchema.parse(resetEmail);

      const response = await supabase.functions.invoke('reset-super-admin-password', {
        body: {
          action: 'request_otp',
          email: resetEmail
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Code envoyé",
        description: "Vérifiez votre email pour le code de vérification.",
      });
      setOtpSent(true);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        toast({
          title: "Erreur",
          description: err.message || "Erreur lors de l'envoi du code",
          variant: "destructive",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setResetLoading(true);

    try {
      const response = await supabase.functions.invoke('reset-super-admin-password', {
        body: {
          action: 'verify_and_reset',
          email: resetEmail,
          token: otp,
          newPassword: newPassword
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Succès",
        description: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      });

      // Réinitialiser le formulaire et fermer le dialog
      setResetDialogOpen(false);
      setResetEmail("");
      setOtpSent(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Code invalide ou expiré",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-10">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="p-3 rounded-full bg-red-50 border border-red-100">
              <ShieldCheck className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-black">Console Super Admin</h1>
            <p className="text-sm text-gray-500 text-center">
              Accès réservé à l'administration centrale
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm text-gray-700 font-medium block mb-2">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="text-sm text-gray-700 font-medium block mb-2">
                Mot de passe *
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 transition-colors"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="w-full mt-2 text-red-500 hover:text-red-600">
                Mot de passe oublié ?
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-black">Réinitialiser le mot de passe</DialogTitle>
                <DialogDescription>
                  {!otpSent 
                    ? "Entrez votre email pour recevoir un code de vérification"
                    : "Entrez le code reçu par email et votre nouveau mot de passe"
                  }
                </DialogDescription>
              </DialogHeader>

              {!otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm text-gray-700 font-medium">Email</label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    onClick={handleRequestOTP} 
                    disabled={resetLoading}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    {resetLoading ? "Envoi..." : "Envoyer le code"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm text-gray-700 font-medium">Code de vérification</label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="bg-white text-center text-2xl tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm text-gray-700 font-medium">Nouveau mot de passe</label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm text-gray-700 font-medium">Confirmer le mot de passe</label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white"
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button 
                      onClick={handleResetPassword} 
                      disabled={resetLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      {resetLoading ? "Réinitialisation..." : "Réinitialiser"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <a 
              href="https://app.crsapp.ma" 
              className="flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à CRSApp
            </a>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Cette console est protégée. Toute tentative d'accès non autorisée sera enregistrée.
          </p>
        </div>
      </div>
    </div>
  );
}
