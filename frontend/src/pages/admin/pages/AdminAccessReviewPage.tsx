import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AccessReview {
  id: string
  name: string
  type: 'quarterly' | 'annual' | 'triggered'
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  scope: string
  reviewers: string[]
  due_date: string
  completed_date?: string
  total_users: number
  reviewed_users: number
  changes_made: number
}

interface ReviewItem {
  user: string
  email: string
  role: string
  last_reviewed: string
  status: 'approved' | 'pending' | 'flagged' | 'role_change'
  reviewer?: string
  comment?: string
}

const REVIEWS: AccessReview[] = [
  {
    id: 'AR-2024-Q4-Finance',
    name: 'Q4 2024 Finance Team',
    type: 'quarterly',
    status: 'in_progress',
    scope: 'Finance department',
    reviewers: ['maria.g@forskale.com'],
    due_date: '2024-11-15',
    total_users: 12,
    reviewed_users: 8,
    changes_made: 1,
  },
  {
    id: 'AR-2024-Q4-Dev',
    name: 'Q4 2024 Development',
    type: 'quarterly',
    status: 'completed',
    scope: 'Engineering & DevOps',
    reviewers: ['john.s@forskale.com', 'emma.w@forskale.com'],
    due_date: '2024-10-31',
    completed_date: '2024-10-28',
    total_users: 24,
    reviewed_users: 24,
    changes_made: 3,
  },
  {
    id: 'AR-2024-Annual-Admin',
    name: 'Annual Admin Access',
    type: 'annual',
    status: 'overdue',
    scope: 'All privileged accounts',
    reviewers: ['ciso@forskale.com'],
    due_date: '2024-10-01',
    total_users: 8,
    reviewed_users: 0,
    changes_made: 0,
  },
]

export default function AdminAccessReviewPage() {
  const [reviews, setReviews] = useState<AccessReview[]>(REVIEWS)
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="secondary" className="text-[10px]">Scheduled</Badge>
      case 'in_progress': return <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed': return <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Completed</Badge>
      case 'overdue': return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
      default: return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'quarterly': return <Badge variant="outline" className="text-[10px]">Quarterly</Badge>
      case 'annual': return <Badge variant="outline" className="text-[10px]">Annual</Badge>
      case 'triggered': return <Badge variant="outline" className="text-[10px] text-orange-600">Triggered</Badge>
      default: return null
    }
  }

  const handleStartReview = (review: AccessReview) => {
    setSelectedReview(review)
    setShowReviewDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-800">
        Access reviews ensure users still need the access they have — satisfying ISO A.5.18 (access rights). Quarterly reviews are mandatory for privileged accounts; annual reviews for all users.
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Scheduled</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>{reviews.filter(r => r.status === 'scheduled').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">In progress</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#639922' }}>{reviews.filter(r => r.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Overdue</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#E24B4A' }}>{reviews.filter(r => r.status === 'overdue').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Completed (90d)</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#1D9E75' }}>{reviews.filter(r => r.status === 'completed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Review cycles</div>
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
              New review cycle
            </Button>
          </div>

          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{review.id}</span>
                      {getTypeBadge(review.type)}
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="text-sm font-medium mt-1">{review.name}</div>
                    <div className="text-[11px] text-gray-400">{review.scope}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500">
                      {review.status === 'completed' ? `Completed: ${review.completed_date}` : `Due: ${review.due_date}`}
                    </div>
                    {review.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        variant={review.status === 'overdue' ? 'destructive' : 'default'}
                        className="h-6 text-[10px] mt-1 px-2"
                        onClick={() => handleStartReview(review)}
                      >
                        {review.status === 'overdue' ? 'Overdue' : 'Start review'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-[10px] text-gray-500">Total users</div>
                    <div className="text-sm font-medium">{review.total_users}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-[10px] text-gray-500">Reviewed</div>
                    <div className="text-sm font-medium">{review.reviewed_users}/{review.total_users}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-[10px] text-gray-500">Changes made</div>
                    <div className="text-sm font-medium">{review.changes_made}</div>
                  </div>
                </div>

                {review.reviewed_users > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] text-gray-500 mb-1">Progress</div>
                    <div className="h-2 bg-gray-100 rounded overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded transition-all"
                        style={{ width: `${(review.reviewed_users / review.total_users) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  {review.reviewers.map(email => (
                    <span key={email} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-3">Role change process</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <div className="text-xs font-medium">Reviewer assigned</div>
                <div className="text-[10px] text-gray-400">Manager or compliance officer</div>
              </div>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <div className="text-xs font-medium">Access verified</div>
                <div className="text-[10px] text-gray-400">Check current access vs job needs</div>
              </div>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <div className="text-xs font-medium">Changes approved</div>
                <div className="text-[10px] text-gray-400">Manager + HR approval</div>
              </div>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <div className="text-xs font-medium">Access updated</div>
                <div className="text-[10px] text-gray-400">Audit logged</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Access Review: {selectedReview?.name}</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                Review each user's access and confirm if it's still appropriate for their role. Flag any discrepancies for follow-up.
              </div>
              <div className="text-xs text-gray-500">
                Showing users for: <span className="font-medium text-gray-900">{selectedReview.scope}</span>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Download review list (CSV)</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}