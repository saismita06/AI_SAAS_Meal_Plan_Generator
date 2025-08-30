

 "use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@/components/spinner";

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

interface WeeklyMealPlan {
  [day: string]: DailyMealPlan;
}

interface MealPlanResponse {
  mealPlan?: WeeklyMealPlan;
  error?: string;
}

interface MealPlanInput {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  snacks: boolean;
  days?: number;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function MealPlanDashboard() {
  const [dietType, setDietType] = useState("");
  const [calories, setCalories] = useState<number>(2000);
  const [allergies, setAllergies] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [snacks, setSnacks] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    async function checkSubscription(userId: string) {
      try {
        const res = await fetch(`/api/check-subscription?userId=${encodeURIComponent(userId)}`);
        const data = await res.json();

        if (!data.subscriptionActive) {
          router.push("/subscribe");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to check subscription:", err);
        router.push("/subscribe");
      }
    }

    checkSubscription(user.id);
  }, [isLoaded, user, router]);

  const mutation = useMutation<MealPlanResponse, Error, MealPlanInput>({
    mutationFn: async (payload: MealPlanInput) => {
      const response = await fetch("/api/generate-mealplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: MealPlanResponse = await response.json();
        throw new Error(errorData.error || "Failed to generate meal plan.");
      }

      return response.json();
    },
  });

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const getMealPlanForDay = (day: string): DailyMealPlan | undefined => {
    if (!mutation.data?.mealPlan) return undefined;
    return mutation.data.mealPlan[day];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: MealPlanInput = {
      dietType,
      calories,
      allergies,
      cuisine,
      snacks,
      days: 7,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Left Panel */}
        <div className="w-full md:w-1/3 lg:w-1/4 p-6 bg-emerald-500 text-white">
          <h1 className="text-2xl font-bold mb-6 text-center">AI Meal Plan Generator</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Diet Type */}
            <div>
              <label htmlFor="dietType" className="block text-sm font-medium mb-1">
                Diet Type
              </label>
              <input
                type="text"
                id="dietType"
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-emerald-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors duration-200 hover:border-emerald-400"
                placeholder="e.g., Vegetarian, Keto, Mediterranean"
              />
            </div>

            {/* Calories */}
            <div>
              <label htmlFor="calories" className="block text-sm font-medium mb-1">
                Daily Calorie Goal
              </label>
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
                min={500}
                max={5000}
                className="w-full px-3 py-2 border border-emerald-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors duration-200 hover:border-emerald-400"
                placeholder="e.g., 2000"
              />
            </div>

            {/* Allergies */}
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium mb-1">
                Allergies or Restrictions
              </label>
              <input
                type="text"
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors duration-200 hover:border-emerald-400"
                placeholder="e.g., Nuts, Dairy, None"
              />
            </div>

            {/* Cuisine */}
            <div>
              <label htmlFor="cuisine" className="block text-sm font-medium mb-1">
                Preferred Cuisine
              </label>
              <input
                type="text"
                id="cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors duration-200 hover:border-emerald-400"
                placeholder="e.g., Italian, Chinese, No Preference"
              />
            </div>

            {/* Snacks */}
            <div className="flex items-center hover:bg-emerald-400 p-1 rounded transition-colors duration-200">
              <input
                type="checkbox"
                id="snacks"
                checked={snacks}
                onChange={(e) => setSnacks(e.target.checked)}
                className="h-4 w-4 text-emerald-300 border-emerald-300 rounded"
              />
              <label htmlFor="snacks" className="ml-2 block text-sm text-white">
                Include Snacks
              </label>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className={`w-full bg-emerald-500 text-white py-2 px-4 rounded-md transition-all duration-200 ${
                  mutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-emerald-600 hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                {mutation.isPending ? "Generating..." : "Generate Meal Plan"}
              </button>
            </div>
          </form>

          {mutation.isError && (
            <div className="mt-4 p-3 bg-red-200 text-red-800 rounded-md">
              {mutation.error?.message || "An unexpected error occurred."}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-2/3 lg:w-3/4 p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6 text-emerald-700">Weekly Meal Plan</h2>

          {mutation.isSuccess && mutation.data.mealPlan ? (
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const mealPlan = getMealPlanForDay(day);
                  return (
                    <div
                      key={day}
                      className="bg-white shadow-md rounded-lg p-4 border border-emerald-200 transition-all duration-200 hover:shadow-lg hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <h3 className="text-xl font-semibold mb-2 text-emerald-600">{day}</h3>
                      {mealPlan ? (
                        <div className="space-y-2">
                          <div>
                            <strong>Breakfast:</strong> {mealPlan.Breakfast}
                          </div>
                          <div>
                            <strong>Lunch:</strong> {mealPlan.Lunch}
                          </div>
                          <div>
                            <strong>Dinner:</strong> {mealPlan.Dinner}
                          </div>
                          {mealPlan.Snacks && (
                            <div>
                              <strong>Snacks:</strong> {mealPlan.Snacks}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">No meal plan available.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : mutation.isPending ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            <p className="text-gray-600">Please generate a meal plan to see it here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
