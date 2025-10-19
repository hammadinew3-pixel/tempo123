import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <Card className="w-full max-w-md shadow-2xl bg-slate-900 border-slate-800">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-full bg-emerald-500/10 mb-2">
              <ShieldCheck className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold">Console Super Admin</h1>
            <p className="text-sm text-gray-400 text-center">
              Accès réservé à l'administration centrale
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-gray-300 block mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="text-sm text-gray-300 block mb-1.5">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-gray-500 text-center">
              Cette console est protégée et réservée aux super administrateurs.
              <br />
              Toute tentative d'accès non autorisée sera enregistrée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
