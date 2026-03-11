import { useState } from "react";
import { AlertTriangle, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttentionRequiredItem } from "@/data/mockActions";

const AttentionRequiredCard = ({ item }: { item: AttentionRequiredItem }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-atlas-urgent-light border border-atlas-urgent-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-atlas-urgent" />
          <span className="text-sm font-semibold text-atlas-urgent">Attention Required (Today)</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-card text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Decision Engine */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Decision Engine</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Detected Situation: {item.decisionEngine.detectedSituation}
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">
              Primary Recommendation: {item.decisionEngine.primaryRecommendation}
            </p>
            <span className="text-xs text-atlas-success font-medium">
              Confidence: {item.decisionEngine.confidence}%
            </span>
          </div>

          {/* Decision Factors box */}
          <div className="bg-muted/60 border border-border rounded-md p-3">
            <span className="text-xs font-semibold text-foreground">Decision Factors:</span>
            <ul className="mt-1.5 space-y-1">
              {item.decisionEngine.decisionFactors.map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Why this recommendation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Why {item.decisionEngine.primaryRecommendation}?
            </h4>
            <ul className="mt-1.5 space-y-1">
              {item.decisionEngine.whyThis.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Objective */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Objective</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{item.decisionEngine.objective}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs h-8">
              Generate Script
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              View Other Options
            </Button>
          </div>
        </div>

        {/* Generated Draft (expandable) */}
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Generated Draft:
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-card border border-border rounded-md">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {item.generatedDraft}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-5 py-2 border-t border-atlas-urgent-border bg-atlas-urgent-light/50 flex items-center gap-2 text-xs text-muted-foreground">
        {item.type === "email" ? <Mail size={12} /> : <Phone size={12} />}
        <span>{item.title}</span>
        <span className="mx-1">•</span>
        <span className="text-atlas-urgent font-medium">{item.overdueLabel}</span>
      </div>
    </div>
  );
};

export default AttentionRequiredCard;
