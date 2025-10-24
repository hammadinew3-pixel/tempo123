/**
 * Retourne le matricule à afficher pour un véhicule.
 * Utilise immatriculation si disponible, sinon immatriculation_provisoire.
 */
export const getDisplayMatricule = (vehicle: {
  immatriculation?: string | null;
  immatriculation_provisoire?: string | null;
}): string => {
  return vehicle.immatriculation || vehicle.immatriculation_provisoire || 'N/A';
};

/**
 * Vérifie si une chaîne de recherche correspond au matricule d'un véhicule
 * (en incluant immatriculation et immatriculation_provisoire)
 */
export const matchesMatriculeSearch = (
  vehicle: {
    immatriculation?: string | null;
    immatriculation_provisoire?: string | null;
  },
  searchTerm: string
): boolean => {
  const searchLower = searchTerm.toLowerCase();
  return (
    vehicle.immatriculation?.toLowerCase().includes(searchLower) ||
    vehicle.immatriculation_provisoire?.toLowerCase().includes(searchLower) ||
    false
  );
};
