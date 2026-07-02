import { SearchForm } from './components/SearchForm'
import { PartnerStrip } from './components/PartnerStrip'

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero + promo wrapper */}
      <div className="mx-4 rounded-2xl shadow-lg md:mx-8">
        {/* Hero section */}
        <section
          className="relative flex min-h-[480px] flex-col items-center justify-center rounded-t-2xl bg-cover bg-center px-4 py-16"
          style={{ backgroundImage: "url('/car.png')" }}
        >
          <div className="absolute inset-0 rounded-t-2xl bg-black/40" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-9xl">
            <h1 className="mb-8 text-center text-3xl leading-tight text-white drop-shadow-md md:text-5xl">
              Compare &amp; Save on<br />
              <span className="font-extrabold">Car Rental</span>
            </h1>
            <SearchForm />
          </div>
        </section>

        {/* Promo banner */}
        <section className="rounded-b-2xl bg-[#1e2a4a] py-3 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-white">
            Find the best car rental deals and book now!
          </p>
        </section>
      </div>

      {/* Partner logos */}
      <PartnerStrip />

      {/* Value proposition */}
      <section className="bg-gray-100 py-10 text-center">
        <p className="mx-auto max-w-2xl text-lg font-bold text-gray-900">
          Our data-driven search site helps you find the best car rentals worldwide in seconds.
        </p>
      </section>
    </main>
  )
}
