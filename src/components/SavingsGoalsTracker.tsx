import React, { useState } from "react";
import { SavingsGoal } from "../types";
import { Target, Calendar, Plus, Trash2, Trophy } from "lucide-react";

interface SavingsGoalsTrackerProps {
  goals: SavingsGoal[];
  onAddGoal: (title: string, targetAmount: number, currentAmount: number, deadline: string) => Promise<void>;
  onUpdateGoal: (id: string, currentAmount: number) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  currency: string;
}

export default function SavingsGoalsTracker({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  currency,
}: SavingsGoalsTrackerProps) {
  // Goal creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  // Add fund state (goalId -> amountToAdd)
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !target || !deadline) return;

    try {
      await onAddGoal(title, Number(target), Number(current) || 0, deadline);
      setTitle("");
      setTarget("");
      setCurrent("");
      setDeadline("");
      setShowAddForm(false);
    } catch (err: any) {
      alert("Failed to create goal: " + err.message);
    }
  };

  const handleAddFunds = async (goalId: string, currentAmount: number) => {
    const amountStr = fundAmounts[goalId];
    if (!amountStr || Number(amountStr) <= 0) return;

    try {
      const addedVal = Number(amountStr);
      await onUpdateGoal(goalId, currentAmount + addedVal);
      setFundAmounts((prev) => ({ ...prev, [goalId]: "" }));
    } catch (err: any) {
      alert("Failed to add funds: " + err.message);
    }
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header & Toggle Add */}
      <div className="flex justify-between items-end border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 block">TARGET TRACKING</span>
          <h2 className="text-2xl font-serif italic text-[#1A1A1A]">Savings Goals</h2>
          <p className="text-xs text-[#1A1A1A]/60 font-serif italic">
            Track and fuel your long-term purchases & security reserve pools.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-none text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? "Hide Settings" : "Create New Goal"}
        </button>
      </div>

      {/* Goal creation Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateGoal}
          className="bg-white border border-[#1A1A1A]/10 rounded-none p-6 space-y-5 animate-in fade-in duration-200 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)]"
        >
          <div className="border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Entry</span>
            <h3 className="font-serif italic text-base">New Goal Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Goal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Buy Mac Studio, Emergency Safety Pool..."
                required
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Target Amount ({currency})
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                required
                min="1"
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Initial Savings ({currency})
              </label>
              <input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Deadline Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#1A1A1A]/10 bg-transparent hover:bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider rounded-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[10px] font-bold uppercase tracking-wider rounded-none cursor-pointer"
            >
              Create Goal
            </button>
          </div>
        </form>
      )}

      {/* Goals grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progressPercent = Math.min(
            100,
            goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
          );
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className={`rounded-none border p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,26,26,0.02)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,0.04)] transition-all relative ${
                isCompleted
                  ? "bg-amber-50/40 border-amber-300"
                  : "bg-white border-[#1A1A1A]/10"
              }`}
            >
              {isCompleted && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#1A1A1A] text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Achieved!
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#1A1A1A]/5 text-[#1A1A1A] border border-[#1A1A1A]/10 rounded-none">
                    <Target className="w-4 h-4 opacity-70" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                      {goal.title}
                    </h3>
                    <span className="text-[10px] text-[#1A1A1A]/50 mt-1 flex items-center gap-1 font-mono">
                      Target deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-[#1A1A1A]/60">
                    <span className="font-mono">
                      {currency}
                      {goal.currentAmount.toLocaleString()} saved
                    </span>
                    <span className="font-mono">
                      {currency}
                      {goal.targetAmount.toLocaleString()} target
                    </span>
                  </div>
                  <div className="w-full bg-[#1A1A1A]/5 h-2 rounded-none overflow-hidden border border-[#1A1A1A]/10">
                    <div
                      className={`h-full rounded-none transition-all duration-300 ${
                        isCompleted ? "bg-amber-500" : "bg-[#1A1A1A]"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] font-mono font-bold text-[#1A1A1A]/40">
                    {progressPercent.toFixed(1)}% completed
                  </div>
                </div>

                {/* Smart Goal Achievement Prediction velocity math */}
                {!isCompleted && (
                  <div className="bg-[#1A1A1A]/5 p-3.5 border border-[#1A1A1A]/10 space-y-1">
                    <div className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]/50">
                      Goal Prediction Engine
                    </div>
                    {(() => {
                      const daysLeft = Math.max(1, (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const monthsLeft = Math.ceil(daysLeft / 30.4);
                      const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                      const requiredMonthly = monthsLeft > 0 ? (amountRemaining / monthsLeft) : 0;
                      
                      return (
                        <div className="text-[11px] text-[#1A1A1A]/80 leading-relaxed font-serif italic">
                          <span>Target achievable in </span>
                          <strong className="font-sans font-bold text-[#1A1A1A] not-italic">{monthsLeft} Month{monthsLeft > 1 ? 's' : ''}</strong>
                          <span> at a velocity of </span>
                          <strong className="font-sans font-bold text-[#1A1A1A] text-xs not-italic">{currency}{Math.round(requiredMonthly).toLocaleString()}/mo</strong>.
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Fund input & actions */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#1A1A1A]/10">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#1A1A1A]/40">
                    + {currency}
                  </span>
                  <input
                    type="number"
                    value={fundAmounts[goal.id] || ""}
                    onChange={(e) =>
                      setFundAmounts((prev) => ({ ...prev, [goal.id]: e.target.value }))
                    }
                    placeholder="Add funds"
                    disabled={isCompleted}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <button
                  onClick={() => handleAddFunds(goal.id, goal.currentAmount)}
                  disabled={isCompleted || !fundAmounts[goal.id]}
                  className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isCompleted
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-[#1A1A1A]"
                  }`}
                >
                  Fuel Goal
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this goal?")) {
                      onDeleteGoal(goal.id);
                    }
                  }}
                  className="p-1.5 bg-transparent hover:bg-red-50 text-[#1A1A1A]/40 hover:text-red-700 border border-[#1A1A1A]/10 hover:border-red-200 rounded-none transition-colors cursor-pointer"
                  title="Delete Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-2 bg-[#1A1A1A]/5 rounded-none p-12 border border-[#1A1A1A]/10 text-center text-[#1A1A1A]/40">
            <Target className="w-7 h-7 text-[#1A1A1A]/30 mx-auto mb-2" />
            <p className="text-sm font-semibold uppercase tracking-wider">No Active Savings Goals</p>
            <p className="text-xs font-serif italic mt-1">Setup goals to stay motivated and track big milestones.</p>
          </div>
        )}
      </div>
    </div>
  );
}
