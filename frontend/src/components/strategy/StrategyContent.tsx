import type { CompanyDeal } from "@/data/mockStrategyData";
import SituationSummary from "./SituationSummary";
import WhyThisStage from "./WhyThisStage";
import InterestJourney from "./InterestJourney";
import StrategyActionItems from "./StrategyActionItems";
import AnalyzeSection from "./AnalyzeSection";
import InterestSignals from "./InterestSignals";
import DecisionFriction from "./DecisionFriction";
import InterestMonitoring from "./InterestMonitoring";
import InterestPatternAnalysis from "./InterestPatternAnalysis";
import DealContext from "./DealContext";
import StrategicRecommendations from "./StrategicRecommendations";

import {
  Zap, ShieldAlert, Bell, BarChart3,
  FileText, Sparkles,
} from "lucide-react";

interface Props {
  deal: CompanyDeal;
}

export default function StrategyContent({ deal }: Props) {
  const isActive = deal.status === 'ongoing_negotiation' || deal.status === 'first_meeting';

  return (
    <div className="flex-1 overflow-y-auto atlas-scrollbar p-5 bg-background transition-all duration-300 ease-in-out">
      <div className="max-w-4xl mx-auto space-y-3">

        <SituationSummary deal={deal} />

        <InterestJourney
          journey={deal.interestJourney}
          companyName={deal.company}
          interestVelocity={deal.interestVelocity}
          daysAtCurrentLevel={deal.daysAtCurrentLevel}
        />

        <WhyThisStage deal={deal} />

        <StrategyActionItems deal={deal} />

        {deal.interestSignals.length > 0 && (
          <AnalyzeSection
            title="Interest Signals Detected"
            preview={`${deal.interestSignals.filter(s => s.type === 'positive').length} positive, ${deal.interestSignals.filter(s => s.type !== 'positive').length} neutral/negative signals`}
            icon={<Zap className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />}
          >
            <InterestSignals signals={deal.interestSignals} interestLevel={deal.interestLevel} />
          </AnalyzeSection>
        )}

        {deal.decisionFriction.length > 0 && (
          <AnalyzeSection
            title="Decision Friction Analysis"
            preview={`${deal.decisionFriction.length} friction points blocking commitment`}
            icon={<ShieldAlert className="h-4 w-4 text-orange-500" />}
          >
            <DecisionFriction
              friction={deal.decisionFriction}
              roadmap={deal.frictionRoadmap}
              interestLevel={deal.interestLevel}
              daysAtCurrentLevel={deal.daysAtCurrentLevel}
            />
          </AnalyzeSection>
        )}


        {deal.interestAlerts.length > 0 && (
          <AnalyzeSection
            title="Monitoring & Alerts"
            preview={`${deal.interestAlerts.filter(a => a.isActive).length} active alerts`}
            icon={<Bell className="h-4 w-4 text-amber-500" />}
          >
            <InterestMonitoring
              alerts={deal.interestAlerts}
              interestLevel={deal.interestLevel}
              daysAtCurrentLevel={deal.daysAtCurrentLevel}
              interestVelocity={deal.interestVelocity}
            />
          </AnalyzeSection>
        )}

        {deal.interestPatterns.length > 0 && (
          <AnalyzeSection
            title="Pattern Analysis"
            preview={`${deal.interestPatterns.length} similar deals compared`}
            icon={<BarChart3 className="h-4 w-4 text-[hsl(var(--forskale-blue))]" />}
          >
            <InterestPatternAnalysis
              patterns={deal.interestPatterns}
              interestLevel={deal.interestLevel}
              interestVelocity={deal.interestVelocity}
            />
          </AnalyzeSection>
        )}

        <AnalyzeSection
          title="Deal Context & Stakeholders"
          preview={`${deal.stakeholders.length} stakeholders, ${deal.interactions.length} interactions`}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        >
          <DealContext deal={deal} />
        </AnalyzeSection>

        {isActive && (deal.strategies.length > 0 || deal.emotionalTriggers.length > 0) && (
          <AnalyzeSection
            title="Psychological Triggers & Strategy"
            preview="Deep triggers, decision profiles, and acceleration tactics"
            icon={<Sparkles className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />}
          >
            <StrategicRecommendations deal={deal} />
          </AnalyzeSection>
        )}
      </div>
    </div>
  );
}

