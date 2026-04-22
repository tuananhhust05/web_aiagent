import { useMemo } from "react";
import { DollarSign, Target, AlertTriangle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState, COGNITIVE_STATES } from "@/data/mockStrategyData";
import { getStageTextColor, getStageBgColor } from "@/lib/stageColors";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  deals: CompanyDeal[];
  blurred: boolean;
}

export default function RevenueDashboard({ deals, blurred }: Props) {
  const { t } = useLanguage();

  const activeDealsList = useMemo(
    () => deals.filter((d) => d.status === "ongoing_negotiation" || d.status === "first_meeting"),
    [deals],
  );

  const parseValue = (v: string) => parseInt(v.replace(/[^0-9]/g, "")) || 0;

  const pipelineValue = useMemo(
    () => activeDealsList.reduce((s, d) => s + parseValue(d.dealValue), 0),
    [activeDealsList],
  );

  const weightedClose = useMemo(
    () => Math.round(activeDealsList.reduce((s, d) => s + (parseValue(d.dealValue) * d.interestLevel) / 100, 0)),
    [activeDealsList],
  );

  const atRiskDeals = useMemo(
    () => activeDealsList.filter((d) => d.daysAtCurrentLevel > 5 || d.interestVelocity <= 0),
    [activeDealsList],
  );
  const atRiskValue = atRiskDeals.reduce((s, d) => s + parseValue(d.dealValue), 0);

  const wonDeals = useMemo(() => deals.filter((d) => d.status === "closed_won"), [deals]);
  const wonValue = wonDeals.reduce((s, d) => s + parseValue(d.dealValue), 0);

  const totalValue = deals.reduce((s, d) => s + parseValue(d.dealValue), 0) || 1;
  const lostDeals = deals.filter((d) => d.status === "closed_lost");
  const lostValue = lostDeals.reduce((s, d) => s + parseValue(d.dealValue), 0);

  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activeDealsList.forEach((d) => {
      const name = getCognitiveState(d.interestLevel).name;
      counts[name] = (counts[name] || 0) + 1;
    });
    return COGNITIVE_STATES.filter((s) => counts[s.name]).map((s) => ({
      name: s.name,
      count: counts[s.name],
      level: s.level,
    }));
  }, [activeDealsList]);

  const fmt = (n: number) => `€${n.toLocaleString()}`;

  const cards = [
    {
      icon: DollarSign,
      label: t("dashboard.pipelineValue"),
      value: fmt(pipelineValue),
      sub: `${activeDealsList.length} ${t("dashboard.dealsInProgress")}`,
      color: "text-[hsl(var(--forskale-teal))]",
      bg: "bg-[hsl(var(--forskale-teal)/0.08)]",
    },
    {
      icon: Target,
      label: t("dashboard.weightedClose"),
      value: fmt(weightedClose),
      sub: t("dashboard.basedOnInterest"),
      color: "text-[hsl(var(--forskale-cyan))]",
      bg: "bg-[hsl(var(--forskale-cyan)/0.08)]",
    },
    {
      icon: AlertTriangle,
      label: t("dashboard.atRiskRevenue"),
      value: fmt(atRiskValue),
      sub: atRiskDeals.length > 0 ? `${atRiskDeals.map((d) => d.company).join(", ")}` : t("dashboard.noDealsAtRisk"),
      color: "text-orange-500",
      bg: "bg-orange-500/8",
    },
    {
      icon: Trophy,
      label: t("dashboard.wonThisQuarter"),
      value: fmt(wonValue),
      sub: wonDeals.length > 0 ? `${wonDeals[0]?.company}` : t("dashboard.noWinsYet"),
      color: "text-[hsl(var(--status-great))]",
      bg: "bg-[hsl(var(--badge-green-bg))]",
    },
  ];

  return null;
}
