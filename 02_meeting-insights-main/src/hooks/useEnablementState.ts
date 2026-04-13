import { useState } from 'react';

type EnablementState = 'pristine' | 'loading' | 'complete';

export function useEnablementState(_meetingId: string) {
  // Always start pristine on mount — backend would track real state
  const [state, setState] = useState<EnablementState>('pristine');

  const startAnalysis = () => {
    setState('loading');
  };

  const completeAnalysis = () => {
    setState('complete');
  };

  const resetAnalysis = () => {
    setState('pristine');
  };

  return { state, startAnalysis, completeAnalysis, resetAnalysis };
}
