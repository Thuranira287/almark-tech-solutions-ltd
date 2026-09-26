import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 18 }: StarRatingProps) {
  const interactive = !!onChange;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={n <= value ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}
