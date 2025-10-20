import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";

export default function AttenteValidation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white border-gray-200 shadow-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-orange-500" />
              <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl text-black">Demande en cours de traitement</CardTitle>
          <CardDescription className="text-gray-600">
            Votre justificatif de paiement a bien été reçu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>📧 Vous recevrez un email</strong> dès que notre équipe aura validé votre paiement.
              <br />
              <span className="text-xs text-blue-600">Délai de traitement : 1 à 2 heures</span>
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h3 className="font-semibold text-black">Que se passe-t-il ensuite ?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#c01533] mt-1">1.</span>
                <span>Notre équipe vérifie votre justificatif de paiement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c01533] mt-1">2.</span>
                <span>Vous recevez un email de confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c01533] mt-1">3.</span>
                <span>Votre compte est activé et vous pouvez accéder à CRSApp</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-4">
              Une question ? Contactez-nous à{" "}
              <a href="mailto:support@crsapp.com" className="text-[#c01533] hover:underline">
                support@crsapp.com
              </a>
            </p>
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full border-gray-300 text-black hover:bg-gray-100"
            >
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
