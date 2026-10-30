export function Stars({ rating }: { rating: number }) {
  const starsArray = [];
  for (let i = 1; i <= 5; i++) {
    const isFull = rating >= i;
    const isHalf = !isFull && rating >= i - 0.5;

    starsArray.push(
      <svg
        key={i}
        className={`w-3.5 h-3.5 stroke-none ${
          isFull ? 'fill-[var(--green)]' : isHalf ? 'fill-[var(--green)] opacity-60' : 'fill-[var(--line)]'
        }`}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m12 2 3 6.5 7 .9-5.2 4.8 1.4 7L12 17.6 5.8 21.2l1.4-7L2 9.4l7-.9z" />
      </svg>
    );
  }

  return (
    <span
      className="stars inline-flex gap-0.5 items-center direction-ltr"
      role="img"
      aria-label={`${rating} من 5`}
    >
      {starsArray}
    </span>
  );
}
