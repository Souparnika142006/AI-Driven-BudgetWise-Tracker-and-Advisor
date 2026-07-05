import { Income, Expense, Budget } from "../types";
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign, AlertTriangle } from "lucide-react";

interface BudgetOverviewProps {
  allIncome: Income[];
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  currency: string;
  activeMonth: string;
  monthlyIncomeGoal: number;
}

export default function BudgetOverview({
  allIncome,
  income,
  expenses,
  budgets,
  currency,
  activeMonth,
  monthlyIncomeGoal,
}: BudgetOverviewProps) {
  const currentMonth = activeMonth;

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr || monthStr.length !== 7) return monthStr;
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year}`;
    }
    return monthStr;
  };

  // 1. Math totals
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const allTimeIncome = allIncome.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netSavings = Math.max(0, totalIncome - totalExpenses);

  // 2. Budgets
  const overallBudgetObj = budgets.find((b) => b.category === "all" && b.month === currentMonth);
  const overallBudgetLimit = overallBudgetObj ? overallBudgetObj.amount : 35000;
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalMonthSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const budgetProgressPercent = Math.min(
    100,
    overallBudgetLimit > 0 ? (totalMonthSpent / overallBudgetLimit) * 100 : 0
  );

  const earningsProgressPercent = Math.min(
    100,
    monthlyIncomeGoal > 0 ? (totalIncome / monthlyIncomeGoal) * 100 : 0
  );

  const remainingBudget = Math.max(0, overallBudgetLimit - totalMonthSpent);

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.03)] flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">
              Total Earnings ({formatMonthYear(activeMonth)})
            </span>
            <h3 className="text-3xl font-serif tracking-tight text-[#1A1A1A]">
              {currency}
              {totalIncome.toLocaleString()}
            </h3>
            <p className="text-[11px] text-green-700 font-serif italic">
              All-Time: {currency}{allTimeIncome.toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.03)] flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">
              Total Spent ({formatMonthYear(activeMonth)})
            </span>
            <h3 className="text-3xl font-serif tracking-tight text-[#1A1A1A]">
              {currency}
              {totalExpenses.toLocaleString()}
            </h3>
            <p className="text-[11px] text-red-700 font-serif italic">All recorded outflows</p>
          </div>
          <div className="p-2.5 bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <TrendingDown className="w-5 h-5 opacity-70" />
          </div>
        </div>

        {/* Card 3: Monthly Budget Left */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.03)] flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">
              Budget Remaining
            </span>
            <h3 className={`text-3xl font-serif tracking-tight ${remainingBudget === 0 ? "text-red-600 font-bold" : "text-[#1A1A1A]"}`}>
              {currency}
              {remainingBudget.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/60 font-serif italic">
              Of {currency}
              {overallBudgetLimit.toLocaleString()} limit
            </p>
          </div>
          <div className="p-2.5 bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <Wallet className="w-5 h-5 opacity-70" />
          </div>
        </div>

        {/* Card 4: Net Savings */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.03)] flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">
              Net Savings ({formatMonthYear(activeMonth)})
            </span>
            <h3 className="text-3xl font-serif tracking-tight text-[#1A1A1A]">
              {currency}
              {netSavings.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/60 font-serif italic">Income minus expenses</p>
          </div>
          <div className="p-2.5 bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <CircleDollarSign className="w-5 h-5 opacity-70" />
          </div>
        </div>
      </div>

      {/* Main Budget Progress & Health Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Progress (2/3 width) */}
        <div className="lg:col-span-8 bg-white rounded-none border border-[#1A1A1A]/10 p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.02)] flex flex-col justify-between">
          <div className="space-y-6">
            {/* Row 1: Budget limit Progress */}
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-40">Monthly Overview Limit</span>
                  <h3 className="text-xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
                    <span>Overall Monthly Budget Progress</span>
                    <span className="text-[10px] bg-[#1A1A1A]/5 text-[#1A1A1A]/70 font-mono font-bold px-2 py-0.5 rounded-none border border-[#1A1A1A]/10">
                      {formatMonthYear(activeMonth)}
                    </span>
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/60">
                    You spent {currency}
                    {totalMonthSpent.toLocaleString()} out of your {currency}
                    {overallBudgetLimit.toLocaleString()} monthly budget limit.
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-serif font-bold text-[#1A1A1A]">
                    {budgetProgressPercent.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#1A1A1A]/50"> of limit reached</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#1A1A1A]/5 h-2 rounded-none overflow-hidden border border-[#1A1A1A]/10 mt-3">
                <div
                  className={`h-full rounded-none transition-all duration-500 ${
                    budgetProgressPercent >= 100
                      ? "bg-red-600"
                      : budgetProgressPercent >= 85
                      ? "bg-orange-500"
                      : "bg-[#1A1A1A]"
                  }`}
                  style={{ width: `${budgetProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Row 2: Earnings Goal Progress */}
            <div className="pt-5 border-t border-[#1A1A1A]/10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-40">Earnings Target Progress</span>
                  <h3 className="text-xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
                    <span>Monthly Earnings Goal Tracker</span>
                    <span className="text-[10px] bg-green-50 text-green-800 font-mono font-bold px-2 py-0.5 rounded-none border border-green-200">
                      Goal: {currency}{monthlyIncomeGoal.toLocaleString()}
                    </span>
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/60">
                    You earned {currency}
                    {totalIncome.toLocaleString()} out of your {currency}
                    {monthlyIncomeGoal.toLocaleString()} monthly earnings target.
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-serif font-bold text-[#1A1A1A]">
                    {earningsProgressPercent.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#1A1A1A]/50"> of goal achieved</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#1A1A1A]/5 h-2 rounded-none overflow-hidden border border-[#1A1A1A]/10 mt-3">
                <div
                  className={`h-full rounded-none transition-all duration-500 ${
                    earningsProgressPercent >= 100
                      ? "bg-green-700"
                      : earningsProgressPercent >= 50
                      ? "bg-emerald-600"
                      : "bg-amber-600"
                  }`}
                  style={{ width: `${earningsProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Alerts */}
          {budgetProgressPercent >= 85 && (
            <div
              className={`p-4 rounded-none border flex gap-3 items-start mt-4 ${
                budgetProgressPercent >= 100
                  ? "bg-red-50/50 border-red-200 text-red-900"
                  : "bg-orange-50/50 border-orange-200 text-orange-900"
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs">
                <strong className="font-bold uppercase tracking-wider text-[10px]">
                  {budgetProgressPercent >= 100 ? "Budget Limit Exceeded! " : "Approaching Budget Limit! "}
                </strong>
                <p className="mt-1 opacity-80 leading-relaxed font-serif italic">
                  {budgetProgressPercent >= 100
                    ? `You have exceeded your monthly budget by ${currency}${(totalMonthSpent - overallBudgetLimit).toLocaleString()}. We advise calling BudgetWise AI Recommendations to find fast saving pathways.`
                    : `You have less than 15% of your overall monthly budget limit remaining. Consider postponing non-essential Shopping.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Smart Budget Health Score Gauge (1/3 width) */}
        <div className="lg:col-span-4 bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.02)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-40">Financial Health Monitor</span>
            <h3 className="text-base font-serif italic text-[#1A1A1A]">Smart Health Score</h3>
            <p className="text-[10px] text-[#1A1A1A]/50 leading-snug">Calculated from savings ratios and limit adherence metrics.</p>
          </div>

          {(() => {
            const savingsRatio = totalIncome > 0 ? (netSavings / totalIncome) : 0;
            const budgetUtilization = overallBudgetLimit > 0 ? (totalMonthSpent / overallBudgetLimit) : 0;
            
            let healthScore = 50;
            if (totalIncome > 0) {
              const savingsPoints = Math.min(60, (savingsRatio / 0.4) * 60);
              let budgetPoints = 40;
              if (budgetUtilization > 0.5) {
                budgetPoints = Math.max(0, 40 - ((budgetUtilization - 0.5) / 0.5) * 40);
              }
              healthScore = Math.max(0, Math.min(100, Math.round(savingsPoints + budgetPoints)));
            } else if (totalExpenses > 0) {
              healthScore = 15;
            } else {
              healthScore = 100;
            }

            let statusLabel = "Safe";
            let statusColor = "text-green-800 bg-green-50 border-green-200";
            let statusBadge = "🟢";
            let healthSummary = "Your spending is well-proportioned relative to your earnings. Keep holding this savings rate.";

            if (healthScore >= 80) {
              statusLabel = "Pristine";
              statusColor = "text-green-800 bg-green-50/50 border-green-200";
              statusBadge = "🟢";
              healthSummary = "Exceptional fiscal health. Saving rate is robust and spending is well below safe thresholds.";
            } else if (healthScore >= 50) {
              statusLabel = "Warning";
              statusColor = "text-amber-800 bg-amber-50/50 border-amber-200";
              statusBadge = "🟡";
              healthSummary = "Moderate spending activity. Trim auxiliary leisure categories to increase savings security buffer.";
            } else {
              statusLabel = "High Risk";
              statusColor = "text-red-800 bg-red-50/50 border-red-200";
              statusBadge = "🔴";
              healthSummary = "High burn rate detected. Outflows exceed safe proportions. Immediate category budgeting is advised.";
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-serif font-bold text-[#1A1A1A]">{healthScore}</span>
                    <span className="text-xs text-[#1A1A1A]/40">/100</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none ${statusColor}`}>
                    {statusBadge} {statusLabel}
                  </span>
                </div>

                <div className="w-full bg-[#1A1A1A]/5 h-1.5 rounded-none overflow-hidden border border-[#1A1A1A]/10">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      healthScore >= 80 ? "bg-green-700" : healthScore >= 50 ? "bg-amber-600" : "bg-red-700"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>

                <p className="text-[10px] text-[#1A1A1A]/70 leading-relaxed font-serif italic border-t border-[#1A1A1A]/5 pt-3">
                  {healthSummary}
                </p>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
