import { useEffect, useState } from "react";
import { Expense } from "../types";
import { Brain, Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface AISuggestionsProps {
  expenses: Expense[];
  currency: string;
  onFetchForecast: () => Promise<{
    projectedSpending: number;
    exceedsBudget: boolean;
    projectedOverspend: number;
    analysisText: string;
  }>;
  onFetchRecommendations: () => Promise<string[]>;
}

export default function AISuggestions({
  expenses,
  currency,
  onFetchForecast,
  onFetchRecommendations,
}: AISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<{
    projectedSpending: number;
    exceedsBudget: boolean;
    projectedOverspend: number;
    analysisText: string;
  } | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [reviewedAnomalies, setReviewedAnomalies] = useState<string[]>([]);

  // Filter out any transaction flagged as an anomaly in history
  const anomalies = expenses.filter((e) => e.isAnomaly);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      const [fData, rData] = await Promise.all([
        onFetchForecast(),
        onFetchRecommendations(),
      ]);
      setForecast(fData);
      setRecommendations(rData);
    } catch (err: any) {
      console.error("Failed to load AI suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const toggleAnomalyReview = (id: string) => {
    if (reviewedAnomalies.includes(id)) {
      setReviewedAnomalies(reviewedAnomalies.filter((aId) => aId !== id));
    } else {
      setReviewedAnomalies([...reviewedAnomalies, id]);
    }
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#1A1A1A]/10">
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 block">INTELLIGENT ADVISORY</span>
          <h2 className="text-2xl font-serif italic text-[#1A1A1A]">BudgetWise AI Advisor</h2>
          <p className="text-xs text-[#1A1A1A]/60 font-serif italic mt-0.5">
            Intelligent spending forecasts, anomaly guards, and customized savings strategies formulated by Gemini.
          </p>
        </div>

        <button
          onClick={fetchAIInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[10px] font-bold uppercase tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : "Recalculate Advisor"}
        </button>
      </div>

      {loading && !forecast ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-none border border-[#1A1A1A]/10 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)]">
          <Sparkles className="w-8 h-8 text-[#1A1A1A]/60 animate-spin mx-auto" />
          <p className="text-sm font-serif italic text-[#1A1A1A]/80">Analyzing your financial footprint...</p>
          <p className="text-xs text-[#1A1A1A]/60 max-w-md mx-auto leading-relaxed">
            Gemini is classifying records, modeling end-of-month spending habits, and formulating bespoke recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1 & 2: Forecast and Suggestions */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* AI Budget Prediction Card */}
            {forecast && (
              <div className="bg-[#1A1A1A] text-white rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)] space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <span className="text-[9px] font-bold tracking-widest text-white/55 uppercase">
                    LIVE SPENDING PREDICTION & MODELING
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">
                      Projected Month-End Outflow
                    </span>
                    <h3 className="text-3xl font-mono font-bold flex items-baseline gap-1">
                      {currency}
                      {forecast.projectedSpending.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-white/40 font-serif italic">Extrapolated daily spending average</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">
                      Budget Status Alert
                    </span>
                    {forecast.exceedsBudget ? (
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Exceeding by {currency}
                          {forecast.projectedOverspend.toLocaleString()}
                        </h4>
                        <p className="text-[10px] text-white/40 font-serif italic">Action recommended to trim expenses</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          On-Track & Safe
                        </h4>
                        <p className="text-[10px] text-white/40 font-serif italic">Keep spending at the current rate</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-bold text-white/55 uppercase tracking-wider block">
                    AI Advisor Summary Analysis
                  </span>
                  <p className="text-xs text-white/90 leading-relaxed font-serif italic bg-white/5 p-4 border border-white/10">
                    {forecast.analysisText}
                  </p>
                </div>
              </div>
            )}

            {/* Smart Recommendations List */}
            <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
              <div className="border-b border-[#1A1A1A]/10 pb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">GEMINI GUIDANCE</span>
                <h3 className="font-serif italic text-base">Smart Savings Recommendations</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((tip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-none bg-white border border-[#1A1A1A]/15 flex gap-3 items-start shadow-[2px_2px_0px_0px_rgba(26,26,26,0.01)]"
                  >
                    <div className="text-xs text-[#1A1A1A]/90 font-serif italic">{tip}</div>
                  </motion.div>
                ))}

                {recommendations.length === 0 && (
                  <p className="col-span-2 text-xs text-[#1A1A1A]/40 py-6 text-center font-serif italic">
                    No active tips loaded. Try requesting recalculation above.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Anomaly Guard & Suspicious Expense Flags */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] flex flex-col space-y-4">
              <div className="border-b border-[#1A1A1A]/10 pb-2 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">ANOMALY DEFENSE</span>
                <h3 className="font-serif italic text-base">AI Outlier Guard</h3>
                <p className="text-[10px] text-[#1A1A1A]/60 leading-relaxed font-serif italic">
                  Spending that surges more than 3x the normal average is flagged.
                </p>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[450px]">
                {anomalies.map((anom) => {
                  const isReviewed = reviewedAnomalies.includes(anom.id);

                  return (
                    <div
                      key={anom.id}
                      className={`p-4 rounded-none border transition-all ${
                        isReviewed
                          ? "bg-[#1A1A1A]/5 border-[#1A1A1A]/10 opacity-50"
                          : "bg-red-50/40 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-red-800 bg-red-100/50 px-2.5 py-0.5 border border-red-200 uppercase tracking-wider">
                            {anom.category}
                          </span>
                          <h4 className="font-bold text-[#1A1A1A] text-xs mt-2.5 break-all">{anom.description}</h4>
                        </div>
                        <span className="font-mono font-bold text-[#1A1A1A] text-xs">
                          {currency}
                          {anom.amount.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#1A1A1A]/60 mt-3 bg-white p-2.5 border border-[#1A1A1A]/10 leading-relaxed font-serif italic">
                        {anom.anomalyReason || "Unusually large outlay identified outside of typical thresholds."}
                      </p>

                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#1A1A1A]/10">
                        <span className="text-[10px] text-[#1A1A1A]/50 font-mono">{anom.date}</span>
                        <button
                          onClick={() => toggleAnomalyReview(anom.id)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] cursor-pointer"
                        >
                          {isReviewed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                              Reviewed
                            </>
                          ) : (
                            "Mark Reviewed"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {anomalies.length === 0 && (
                  <div className="py-12 text-center text-[#1A1A1A]/40 space-y-1.5">
                    <CheckCircle2 className="w-6 h-6 text-green-700 mx-auto" />
                    <p className="text-xs font-semibold uppercase tracking-wider">All Clear</p>
                    <p className="text-[10px] font-serif italic">
                      No unusual spending anomalies detected in logs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Java Rule Engine Blueprint Card (Interview Placement Highlight) */}
            <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
              <div className="border-b border-[#1A1A1A]/10 pb-2 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">BACKEND ARCHITECTURE</span>
                <h3 className="font-serif italic text-base">Java Rule Engine Model</h3>
                <p className="text-[10px] text-[#1A1A1A]/60 leading-relaxed font-serif italic">
                  Visualizing how this system executes intelligent rules inside the Spring Boot container.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Categorizer */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider text-[#1A1A1A]/80">
                    <span>1. Keyword Matching (NLP-lite)</span>
                    <span className="font-mono text-green-700 font-bold">ACTIVE</span>
                  </div>
                  <div className="bg-[#1A1A1A]/5 p-2.5 border border-[#1A1A1A]/5 font-mono text-[10px] leading-relaxed text-[#1A1A1A]/80">
                    <div>Swiggy / Zomato → Food</div>
                    <div>Uber / Ola → Transport</div>
                    <div>Amazon / Flipkart → Shopping</div>
                  </div>
                </div>

                {/* 2. Forecast Formula */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider text-[#1A1A1A]/80">
                    <span>2. Spending Extrapolation</span>
                    <span className="font-mono text-green-700 font-bold">ACTIVE</span>
                  </div>
                  <div className="bg-[#1A1A1A]/5 p-2.5 border border-[#1A1A1A]/5 font-mono text-[10px] leading-relaxed text-[#1A1A1A]/80">
                    <div className="font-bold">Avg Daily Spend × Remaining Days</div>
                    <div className="text-[9px] italic text-[#1A1A1A]/50 mt-1 leading-normal">
                      Calculates projected month-end outflow dynamically and flags early budget warnings.
                    </div>
                  </div>
                </div>

                {/* 3. Recommendation Rules */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider text-[#1A1A1A]/80">
                    <span>3. Suggestion Assertions</span>
                    <span className="font-mono text-green-700 font-bold font-mono">ACTIVE</span>
                  </div>
                  <div className="bg-[#1A1A1A]/5 p-2.5 border border-[#1A1A1A]/5 font-mono text-[10px] space-y-1 text-[#1A1A1A]/80 leading-normal">
                    <div>• If Food &gt; 40% → Warn food proportion</div>
                    <div>• If Shopping &gt; 30% → Warn luxury impulses</div>
                    <div>• If Savings &lt; 20% → Show budget safety trigger</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
