import { useState, useCallback, useEffect, useRef } from "react";

export interface FrameworkScore {
  id: string;
  name: string;
  score: number;
}

export interface FrameworkResult {
  winner: string;
  winnerId: string;
  score: number;
  runnerUp: string;
  runnerUpScore: number;
  allScores: Record<string, number>;
}

const frameworkScores: Record<string, number> = {
  demo: 42,
  meddic: 79,
  spiced: 58,
  bant: 65,
  discovery: 71,
  gpct: 48,
  champ: 55,
  spin: 52,
};

const frameworkNames: Record<string, string> = {
  demo: "Demo Call",
  meddic: "MEDDIC",
  spiced: "SPICED",
  bant: "BANT",
  discovery: "Discovery Call",
  gpct: "GPCT",
  champ: "CHAMP",
  spin: "SPIN",
};

const frameworkIds = Object.keys(frameworkScores);

const useFrameworkScoring = () => {
  const [currentScanIndex, setCurrentScanIndex] = useState(-1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [winner, setWinner] = useState<FrameworkResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const startScanning = useCallback(() => {
    cleanup();
    setScores({});
    setWinner(null);
    setIsComplete(false);
    setIsScanning(true);
    setCurrentScanIndex(0);
  }, [cleanup]);

  useEffect(() => {
    if (!isScanning || currentScanIndex < 0) return;

    if (currentScanIndex >= frameworkIds.length) {
      // All scanned — determine winner
      const sorted = [...frameworkIds].sort(
        (a, b) => frameworkScores[b] - frameworkScores[a]
      );
      const winnerId = sorted[0];
      const runnerUpId = sorted[1];

      const t = setTimeout(() => {
        setWinner({
          winner: frameworkNames[winnerId],
          winnerId,
          score: frameworkScores[winnerId],
          runnerUp: frameworkNames[runnerUpId],
          runnerUpScore: frameworkScores[runnerUpId],
          allScores: frameworkScores,
        });
        setIsComplete(true);
        setIsScanning(false);
      }, 800);
      timersRef.current.push(t);
      return;
    }

    const id = frameworkIds[currentScanIndex];
    const t = setTimeout(() => {
      setScores((prev) => ({ ...prev, [id]: frameworkScores[id] }));
      setCurrentScanIndex((prev) => prev + 1);
    }, 450);
    timersRef.current.push(t);

    return () => {};
  }, [currentScanIndex, isScanning]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setCurrentScanIndex(-1);
    setScores({});
    setWinner(null);
    setIsComplete(false);
    setIsScanning(false);
  }, [cleanup]);

  return {
    currentScanIndex,
    scores,
    winner,
    isComplete,
    isScanning,
    startScanning,
    reset,
    frameworkIds,
    frameworkNames,
    totalFrameworks: frameworkIds.length,
  };
};

export default useFrameworkScoring;
