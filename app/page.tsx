'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#007733] flex flex-col items-center justify-between py-10 px-8">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Logo banco */}
        <Image src="/logo-banco.png" alt="Banco Falabella" width={160} height={60} className="object-contain" />

        {/* Logo campaña */}
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={220} height={120} className="object-contain" />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/promotor"
          className="bg-white text-[#007733] font-bold text-xl py-5 px-8 rounded-2xl text-center shadow-lg active:scale-95 transition-transform"
        >
          🎯 App Promotor
        </Link>
        <Link
          href="/estacion3"
          className="bg-white text-[#007733] font-bold text-xl py-5 px-8 rounded-2xl text-center shadow-lg active:scale-95 transition-transform"
        >
          🎯 Jugadas en Clave — Est. 3
        </Link>
        <Link
          href="/trivia"
          className="bg-white text-[#007733] font-bold text-xl py-5 px-8 rounded-2xl text-center shadow-lg active:scale-95 transition-transform"
        >
          🧠 Trivia — Estación 4
        </Link>
        <Link
          href="/ranking"
          className="bg-white/20 border-2 border-white text-white font-bold text-xl py-5 px-8 rounded-2xl text-center shadow-lg active:scale-95 transition-transform"
        >
          🏆 Ranking en Vivo
        </Link>
      </div>

      {/* Footer Social */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/60 text-xs font-medium tracking-wide">Plataforma Desarrollada por:</p>
        <Image src="/logo-social.png" alt="Social Experience" width={100} height={40} className="object-contain opacity-70" />
      </div>
    </main>
  )
}
