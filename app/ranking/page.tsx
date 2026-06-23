'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase, Participante } from '@/lib/supabase'
import { Trophy, Star } from 'lucide-react'

const MEDALLAS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

const COLORES_TOP = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-amber-600 text-amber-100',
  'bg-[#007A40] text-white',
  'bg-[#007733] text-white',
]

export default function RankingPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [horaFormato, setHoraFormato] = useState('')

  const cargarRanking = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .order('puntos_total', { ascending: false })
      .limit(10)

    if (data) {
      setParticipantes(data)
      setHoraFormato(new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
  }

  useEffect(() => {
    cargarRanking()

    // Tiempo real via Supabase
    const channel = supabase
      .channel('ranking-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participantes' },
        () => { cargarRanking() }
      )
      .subscribe()

    // Polling de respaldo cada 5 segundos
    const intervalo = setInterval(cargarRanking, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(intervalo)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#007733] flex flex-col items-center pb-12">
      {/* Header */}
      <div className="w-full px-8 py-5 flex items-center justify-between mb-6">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={140} height={55} className="object-contain" />
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={120} height={55} className="object-contain" />
      </div>

      <div className="text-center mb-6 px-6">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Trophy className="text-yellow-300" size={36} />
          <h1 className="text-4xl font-black text-white tracking-tight">Ranking en Vivo</h1>
          <Trophy className="text-yellow-300" size={36} />
        </div>
        <p className="text-green-300 text-sm mt-1">Actualizado: {horaFormato}</p>
      </div>

      {/* Layout: ranking + premios */}
      <div className="w-full max-w-5xl px-4 flex flex-col lg:flex-row gap-6 items-start">

      {/* Columna ranking */}
      <div className="flex-1 flex flex-col gap-6">

      {/* Top 5 destacados */}
      {participantes.length > 0 && (
        <div className="w-full mb-0">
          <div className="grid grid-cols-1 gap-3">
            {participantes.slice(0, 5).map((p, i) => (
              <div
                key={p.cedula}
                className={`flex items-center justify-between rounded-2xl px-6 py-4 shadow-lg ${COLORES_TOP[i]} ${i === 0 ? 'scale-105 shadow-yellow-300/50 shadow-xl' : ''} transition-all duration-500`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{MEDALLAS[i]}</span>
                  <div>
                    <p className="font-black text-2xl tracking-wide">
                      {p.nombre || p.cedula}
                    </p>
                    <p className="text-xs opacity-60 font-medium">{p.cedula}</p>
                    <div className="flex gap-2 mt-0.5 opacity-75 text-xs">
                      {[1, 2, 3, 4].map((est) => {
                        const pts = p[`estacion_${est}` as keyof Participante] as number
                        return pts > 0 ? (
                          <span key={est} className="bg-black/10 rounded px-1.5 py-0.5">
                            E{est}: {pts}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-4xl">{p.puntos_total}</p>
                  <p className="text-xs opacity-70 font-semibold">PTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resto del ranking (posiciones 6+) */}
      {participantes.length > 5 && (
        <div className="w-full">
          <h2 className="text-white font-bold text-lg mb-3 text-center opacity-80">Otros participantes</h2>
          <div className="bg-white/20 backdrop-blur rounded-2xl overflow-hidden">
            {participantes.slice(5).map((p, i) => (
              <div
                key={p.cedula}
                className="flex items-center justify-between px-6 py-3 border-b border-white/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/60 font-bold w-6 text-center">{i + 6}</span>
                  <div>
                    <p className="text-white font-semibold">{p.nombre || p.cedula}</p>
                    <p className="text-white/50 text-xs">{p.cedula}</p>
                  </div>
                </div>
                <span className="text-white font-black text-xl">{p.puntos_total} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {participantes.length === 0 && (
        <div className="text-center text-green-200 mt-10">
          <Star size={60} className="mx-auto mb-4 opacity-50" />
          <p className="text-2xl font-bold">¡El juego está por comenzar!</p>
          <p className="text-lg opacity-70 mt-2">Los participantes aparecerán aquí en tiempo real</p>
        </div>
      )}

      </div>{/* fin columna ranking */}

      {/* Columna premios */}
      <div className="w-full lg:w-72 shrink-0">
        <div className="bg-white/15 backdrop-blur rounded-2xl overflow-hidden">
          <div className="bg-yellow-400 px-4 py-3 text-center">
            <p className="font-black text-yellow-900 text-lg tracking-tight">🏆 Premios</p>
          </div>
          <div className="flex flex-col">
            {[
              { puesto: '1.º', premio: 'Entrada doble a concierto', puntos: '15.000 CMR Puntos', concierto: true },
              { puesto: '2.º', premio: 'Entrada doble a concierto', puntos: '12.000 CMR Puntos', concierto: true },
              { puesto: '3.º', premio: 'Entrada doble a concierto', puntos: '10.000 CMR Puntos', concierto: true },
              { puesto: '4.º', premio: 'Entrada doble a concierto', puntos: '8.000 CMR Puntos',  concierto: true },
              { puesto: '5.º', premio: null,                        puntos: '7.000 CMR Puntos',  concierto: false },
              { puesto: '6.º', premio: null,                        puntos: '6.000 CMR Puntos',  concierto: false },
              { puesto: '7.º', premio: null,                        puntos: '5.000 CMR Puntos',  concierto: false },
              { puesto: '8.º', premio: null,                        puntos: '4.000 CMR Puntos',  concierto: false },
              { puesto: '9.º', premio: null,                        puntos: '3.500 CMR Puntos',  concierto: false },
              { puesto: '10.º', premio: null,                       puntos: '2.500 CMR Puntos',  concierto: false },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-white/10 last:border-0 ${i < 4 ? 'bg-yellow-400/10' : ''}`}>
                <span className="text-white font-black text-sm w-8 shrink-0">{item.puesto}</span>
                <div className="flex flex-col min-w-0">
                  {item.concierto && (
                    <span className="text-yellow-300 text-xs font-semibold leading-tight">🎵 Entrada doble concierto</span>
                  )}
                  <span className="text-white font-bold text-xs leading-tight">⭐ {item.puntos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>{/* fin layout flex */}

      <div className="mt-10 flex flex-col items-center gap-2">
        <p className="text-white/50 text-xs font-medium tracking-wide">Plataforma Desarrollada por:</p>
        <Image src="/logo-social.png" alt="Social Experience" width={90} height={36} className="object-contain opacity-50" />
      </div>
    </main>
  )
}
