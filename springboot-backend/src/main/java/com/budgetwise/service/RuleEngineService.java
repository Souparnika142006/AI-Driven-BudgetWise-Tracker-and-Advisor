package com.budgetwise.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;

@Service
public class RuleEngineService {

    /**
     * Module 7: Smart Expense Categorization (Java Logic)
     * Replaces expensive AI models with high-speed pattern-matching lists.
     */
    public String autoCategorizeExpense(String description) {
        if (description == null || description.isEmpty()) {
            return "Others";
        }
        
        String descLower = description.toLowerCase().trim();

        // 1. Food & Groceries Keywords
        if (descLower.contains("swiggy") || descLower.contains("zomato") || 
            descLower.contains("restaurant") || descLower.contains("food") || 
            descLower.contains("pizza") || descLower.contains("burger") || 
            descLower.contains("grocery") || descLower.contains("supermarket") ||
            descLower.contains("dinner") || descLower.contains("lunch")) {
            return "Food";
        }

        // 2. Transport & Commuting Keywords
        if (descLower.contains("uber") || descLower.contains("ola") || 
            descLower.contains("rapido") || descLower.contains("metro") || 
            descLower.contains("train") || descLower.contains("bus") || 
            descLower.contains("fuel") || descLower.contains("petrol") || 
            descLower.contains("auto") || descLower.contains("cab")) {
            return "Transport";
        }

        // 3. Shopping & E-Commerce Keywords
        if (descLower.contains("amazon") || descLower.contains("flipkart") || 
            descLower.contains("myntra") || descLower.contains("meesho") || 
            descLower.contains("shopping") || descLower.contains("clothes") || 
            descLower.contains("mall") || descLower.contains("buy")) {
            return "Shopping";
        }

        // 4. Utility Bills & Recharges
        if (descLower.contains("electricity") || descLower.contains("broadband") || 
            descLower.contains("wifi") || descLower.contains("mobile") || 
            descLower.contains("recharge") || descLower.contains("jio") || 
            descLower.contains("airtel") || descLower.contains("gas") || 
            descLower.contains("water bill")) {
            return "Bills";
        }

        // 5. Rent & Accommodations
        if (descLower.contains("rent") || descLower.contains("room") || 
            descLower.contains("flat") || descLower.contains("pg") || 
            descLower.contains("hostel")) {
            return "Rent";
        }

        // 6. Entertainment & Subscriptions
        if (descLower.contains("netflix") || descLower.contains("prime") || 
            descLower.contains("spotify") || descLower.contains("hotstar") || 
            descLower.contains("movie") || descLower.contains("theater") || 
            descLower.contains("game") || descLower.contains("gaming") ||
            descLower.contains("pub") || descLower.contains("party")) {
            return "Entertainment";
        }

        // 7. Medical & Healthcare
        if (descLower.contains("hospital") || descLower.contains("doctor") || 
            descLower.contains("pharmacy") || descLower.contains("medicine") || 
            descLower.contains("apollo") || descLower.contains("medical") || 
            descLower.contains("clinic")) {
            return "Medical";
        }

        // 8. Education & Courses
        if (descLower.contains("course") || descLower.contains("udemy") || 
            descLower.contains("coursera") || descLower.contains("book") || 
            descLower.contains("tuition") || descLower.contains("college") || 
            descLower.contains("fees")) {
            return "Education";
        }

        return "Others";
    }

    /**
     * Module 8: Smart Budget Prediction Logic
     * Formula: Projected Outflow = (Current Month Expenses / Days Passed) * Remaining Days + Current Expenses
     */
    public Map<String, Object> calculateBudgetPrediction(double currentMonthExpenses, double overallBudgetLimit) {
        Map<String, Object> predictionReport = new HashMap<>();
        
        LocalDate today = LocalDate.now();
        int dayOfMonth = today.getDayOfMonth();
        int totalDaysInMonth = today.lengthOfMonth();
        int remainingDays = totalDaysInMonth - dayOfMonth;

        // Prevent division by zero
        double averageDailySpend = currentMonthExpenses / (dayOfMonth > 0 ? dayOfMonth : 1);
        double projectedRemainingExpenses = averageDailySpend * remainingDays;
        double predictedTotalExpenses = currentMonthExpenses + projectedRemainingExpenses;

        boolean isLikelyToExceed = predictedTotalExpenses > overallBudgetLimit;
        double deficit = isLikelyToExceed ? (predictedTotalExpenses - overallBudgetLimit) : 0.0;

        predictionReport.put("currentDay", dayOfMonth);
        predictionReport.put("remainingDays", remainingDays);
        predictionReport.put("avgDailySpend", Math.round(averageDailySpend));
        predictionReport.put("predictedTotalExpenses", Math.round(predictedTotalExpenses));
        predictionReport.put("isLikelyToExceed", isLikelyToExceed);
        predictionReport.put("predictedDeficit", Math.round(deficit));
        
        if (isLikelyToExceed) {
            predictionReport.put("advisoryMessage", "⚠️ ALERT: Based on your average daily spend, you are likely to exceed your limit by " + Math.round(deficit) + "! Consider holding back luxury purchases.");
        } else {
            predictionReport.put("advisoryMessage", "🟢 SAFE: Your financial burn rate is within safe thresholds. Keep maintaining your steady spending pacing.");
        }

        return predictionReport;
    }

    /**
     * Module 9: Intelligent Recommendation Engine Rules
     * Runs Drools-like business assertions to discover negative saving patterns and output smart recommendations.
     */
    public List<String> generatePersonalizedSavingSuggestions(double totalIncome, Map<String, Double> categorySpending) {
        List<String> suggestions = new ArrayList<>();

        if (totalIncome <= 0) {
            suggestions.add("💡 Record your monthly salary or freelancing payouts to unlock fully personalized recommendations.");
            return suggestions;
        }

        double foodSpend = categorySpending.getOrDefault("Food", 0.0);
        double shoppingSpend = categorySpending.getOrDefault("Shopping", 0.0);
        double entertainmentSpend = categorySpending.getOrDefault("Entertainment", 0.0);

        double foodRatio = foodSpend / totalIncome;
        double shoppingRatio = shoppingSpend / totalIncome;
        double entertainmentRatio = entertainmentSpend / totalIncome;

        double totalExpenses = categorySpending.values().stream().mapToDouble(Double::doubleValue).sum();
        double savings = totalIncome - totalExpenses;
        double savingsRatio = savings / totalIncome;

        // Rule 1: Food Overspending (Food > 40%)
        if (foodRatio > 0.40) {
            suggestions.add("🍔 Consuming " + Math.round(foodRatio * 100) + "% of income on Food! We highly suggest substituting 3 commercial Swiggy/Zomato deliveries with home cooking this week to secure cash.");
        }

        // Rule 2: Luxury impulse control (Shopping > 30%)
        if (shoppingRatio > 0.30) {
            suggestions.add("🛍️ Luxury spending is at " + Math.round(shoppingRatio * 100) + "%. Implement the '24-Hour Wait Rule' on Amazon or Flipkart baskets before checking out to curtail impulses.");
        }

        // Rule 3: Entertainment & Leisure Outliers
        if (entertainmentRatio > 0.20) {
            suggestions.add("🍿 Entertainment bills represents " + Math.round(entertainmentRatio * 100) + "% of overall capital. Audit streaming subscriptions and cancel redundant services.");
        }

        // Rule 4: Low Savings Index (< 20%)
        if (savingsRatio < 0.20) {
            suggestions.add("⚠️ Critical Alert: Monthly savings rate stands at a fragile " + Math.round(savingsRatio * 100) + "%. Best practice target is to put away at least 20% on paycheck day.");
        } else {
            suggestions.add("🎉 Excellent work! Your active monthly savings rate of " + Math.round(savingsRatio * 100) + "% comfortably exceeds the baseline target index of 20%. Keep fueling goals.");
        }

        return suggestions;
    }
}
