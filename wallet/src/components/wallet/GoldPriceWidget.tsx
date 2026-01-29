import { TrendingUp } from 'lucide-react'
import { Card, IconBadge } from '@/components/ui'
import { GOLD_PRICE_PER_GRAM, GOLD_PRICE_PER_OZ } from '@/lib/api'

interface GoldPriceWidgetProps {
  pricePerGram?: number
  pricePerOz?: number
  className?: string
}

export function GoldPriceWidget({
  pricePerGram = GOLD_PRICE_PER_GRAM,
  pricePerOz = GOLD_PRICE_PER_OZ,
  className = '',
}: GoldPriceWidgetProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconBadge color="primary">
            <TrendingUp />
          </IconBadge>
          <div>
            <p className="text-gray-400 text-xs">Gold Spot Price</p>
            <p className="text-white font-semibold">${pricePerGram.toFixed(2)}/gram</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Per Troy Ounce</p>
          <p className="text-yellow-400 font-semibold">${pricePerOz.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  )
}
