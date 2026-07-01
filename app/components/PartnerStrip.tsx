import Image from 'next/image'

const LOGOS = [
  { name: 'Kayak',      src: '/logos/kayak.svg' },
  { name: 'Budget',     src: '/logos/budget.gif' },
  { name: 'Enterprise', src: '/logos/enterprise.png' },
  { name: 'Alamo',      src: '/logos/alamo.png' },
  { name: 'Expedia',    src: '/logos/expedia.svg' },
  { name: 'Orbitz',     src: '/logos/orbitz.png' },
  { name: 'Hertz',      src: '/logos/hertz.png' },
]

export function PartnerStrip() {
  return (
    <section className="overflow-hidden bg-white py-4" aria-label="Our partners">
      <div className="flex w-max animate-[scroll-left_20s_linear_infinite]">
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <Image
            key={`${logo.name}-${i}`}
            src={logo.src}
            alt={logo.name}
            width={120}
            height={32}
            className="mx-8 h-8 object-contain"
          />
        ))}
      </div>
    </section>
  )
}
