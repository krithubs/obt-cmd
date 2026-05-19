type BrandLogoProps = {
  className?: string
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-brand-surface shadow-soft ${className}`}>
      <img
        src="/images/phuyai-lee-logo.png"
        alt="PhuyaiLee"
        className="h-full w-full object-cover"
      />
    </div>
  )
}
