import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
