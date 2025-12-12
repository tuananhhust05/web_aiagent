import React from 'react'
import GoalWorkflowPage from './GoalWorkflowPage'

export default function Renewals() {
  return (
    <GoalWorkflowPage
      title="Renewals"
      subtitle="Aumenta il tasso di rinnovo"
      sourceKey="renewals"
      workflowFunction="renewals"
    />
  )
}

