'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ChampionshipRulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChampionshipRulesModal({ isOpen, onClose }: ChampionshipRulesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">Championship Format Rules</h2>
            <Button variant="ghost" onClick={onClose} className="text-text-secondary hover:text-text-primary">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">How It Works</h3>
            <p className="text-text-secondary">
              Championship format is a position-based tournament where advancement is determined by individual scores, not just match wins.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Position Selection</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>When joining, you must choose either <span className="text-cyber-green font-semibold">PRO</span> or <span className="text-neon-orange font-semibold">CON</span> position</li>
              <li>Positions must be balanced (50% PRO, 50% CON)</li>
              <li>Tournament cannot start until positions are balanced</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Round 1: Score-Based Advancement</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>All Round 1 matches use the same 7 judges for consistency</li>
              <li>Matches are PRO vs CON only (no PRO vs PRO or CON vs CON)</li>
              <li>After Round 1, participants are grouped by position (PRO vs CON)</li>
              <li>Top 50% from each position advance, based on individual scores</li>
              <li><strong className="text-text-primary">You can lose your match but still advance if you score higher than peers on your side!</strong></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Tiebreakers</h3>
            <p className="text-text-secondary mb-2">If participants have the same score, tiebreakers are applied in order:</p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Match winner (if one won and one lost)</li>
              <li>Score differential (who won/lost by more points)</li>
              <li>Higher ELO rating</li>
              <li>Earlier registration time</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Subsequent Rounds</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Round 2+ uses standard bracket elimination (winners advance)</li>
              <li>Finals always has opposite positions (one PRO vs one CON)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Scoring</h3>
            <p className="text-text-secondary">
              Each judge scores both participants on a 0-100 scale. Your final score is the average of all judge scores. 
              Higher scores mean better performance, regardless of whether you won or lost your match.
            </p>
          </div>

          <div className="pt-4 border-t border-bg-tertiary">
            <Button variant="primary" onClick={onClose} className="w-full">
              Got It!
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

