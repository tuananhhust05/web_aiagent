---
name: Meeting Sequence System
description: Meeting count badges (M1/M2) replace interest percentages, velocity tracking (normal/stalled/fast)
type: feature
---
Calendar cards display meeting count badges (M1, M2, M3) instead of interest percentage badges.
- M1 (first meeting): amber styling
- M2+ (subsequent): teal styling
- Velocity dots: teal=normal, red=stalled, blue=fast

Data lives in `src/lib/meetingSequence.ts`. Strategy panel, Suggestion Pro, Enter the Call, and accordion badges all use velocity-aware messaging.
