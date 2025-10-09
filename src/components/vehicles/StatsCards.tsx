import { ArrowDownToLine, ArrowUpFromLine, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalRevenue: number;
  totalExpenses: number;
  totalReservations: number;
  onRevenueClick: () => void;
  onExpensesClick: () => void;
  onReservationsClick: () => void;
}

export function StatsCards({
  totalRevenue,
  totalExpenses,
  totalReservations,
  onRevenueClick,
  onExpensesClick,
  onReservationsClick
}: StatsCardsProps) {
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue Card */}
      <Card 
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover-scale group"
        onClick={onRevenueClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-700">Revenu Total</p>
              <p className="text-2xl font-bold text-green-900">
                {totalRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <ArrowDownToLine className="w-5 h-5 text-green-700" />
            </div>
          </div>
          <p className="text-xs text-green-600 flex items-center gap-1">
            → Voir les détails
          </p>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card 
        className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover-scale group"
        onClick={onExpensesClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-700">Dépense Totale</p>
              <p className="text-2xl font-bold text-red-900">
                {totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </p>
            </div>
            <div className="bg-red-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <ArrowUpFromLine className="w-5 h-5 text-red-700" />
            </div>
          </div>
          <p className="text-xs text-red-600 flex items-center gap-1">
            → Voir les détails
          </p>
        </CardContent>
      </Card>

      {/* Net Profit Card */}
      <Card 
        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 hover-scale group"
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700">Bénéfice Net</p>
              <p className="text-2xl font-bold text-blue-900">
                {netProfit.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <p className="text-xs text-blue-600">
            {netProfit > 0 ? 'Rentable' : 'Déficitaire'}
          </p>
        </CardContent>
      </Card>

      {/* Reservations Card */}
      <Card 
        className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover-scale group"
        onClick={onReservationsClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-700">Réservations</p>
              <p className="text-2xl font-bold text-purple-900">
                {totalReservations.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-purple-700" />
            </div>
          </div>
          <p className="text-xs text-purple-600 flex items-center gap-1">
            → Plus de détails
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
