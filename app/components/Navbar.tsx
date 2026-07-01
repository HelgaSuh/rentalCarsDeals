import Image from 'next/image'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center bg-white px-4 shadow-sm">
      <Image src="/logo.png" alt="Rental Cars Deals" height={30} width={120} priority className="ml-12" />
    </nav>
  )
}
