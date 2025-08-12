"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessStrategy } from "@gabe/types";
import { ConversationalBoardroom } from "@gabe/components";

export default function SimulationPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<BusinessStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get strategy from sessionStorage
    const strategyData = sessionStorage.getItem("businessStrategy");

    if (!strategyData) {
      // Redirect to strategy input if no data found
      router.push("/strategy-input");
      return;
    }

    try {
      const parsedStrategy = JSON.parse(strategyData) as BusinessStrategy;
      setStrategy(parsedStrategy);
    } catch (error) {
      console.error("Error parsing strategy data:", error);
      router.push("/strategy-input");
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return null; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <ConversationalBoardroom strategy={strategy} />
    </div>
  );
}
