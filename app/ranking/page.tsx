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

const PREMIOS = [
  { concierto: true,  puntos: '15.000 CMR Puntos' },
  { concierto: true,  puntos: '12.000 CMR Puntos' },
  { concierto: true,  puntos: '10.000 CMR Puntos' },
  { concierto: true,  puntos: '8.000 CMR Puntos'  },
  { concierto: false, puntos: '7.000 CMR Puntos'  },
  { concierto: false, puntos: '6.000 CMR Puntos'  },
  { concierto: false, puntos: '5.000 CMR Puntos'  },
  { concierto: false, puntos: '4.000 CMR Puntos'  },
  { concierto: false, puntos: '3.500 CMR Puntos'  },
  { concierto: false, puntos: '2.500 CMR Puntos'  },
]

export default function RankingPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [horaFormato, setHoraFormato] = useState('')

  const cargarRanking = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .order('puntos_total', { ascending: false })
      .order('tiempo_trivia', { ascending: true, nullsFirst: false })
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
      <div className="w-full px-8 py-3 flex items-center justify-between mb-2">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={140} height={55} className="object-contain" />
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={120} height={55} className="object-contain" />
      </div>

      <div className="text-center mb-4 px-6">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Trophy className="text-yellow-300" size={36} />
          <h1 className="text-4xl font-black text-white tracking-tight">Ranking en Vivo</h1>
          <Trophy className="text-yellow-300" size={36} />
        </div>
        <p className="text-green-300 text-sm mt-1">Actualizado: {horaFormato}</p>
      </div>

      {/* Ranking con premios inline */}
      <div className="w-full max-w-3xl px-4 flex flex-col gap-3">

        {participantes.length > 0 && participantes.map((p, i) => {
          const premio = PREMIOS[i]
          const estaTop5 = i < 5
          const colorClase = estaTop5 ? COLORES_TOP[i] : 'bg-white/20 text-white'
          const escala = i === 0 ? 'scale-[1.02]' : ''

          return (
            <div key={p.cedula} className={`flex gap-3 items-stretch ${escala} transition-all duration-500`}>
              {/* Info participante */}
              <div className={`flex-1 flex items-center justify-between rounded-2xl px-5 py-4 shadow-md ${colorClase}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{estaTop5 ? MEDALLAS[i] : <span className="font-black text-lg opacity-60">{i + 1}</span>}</span>
                  <div>
                    <p className="font-black text-xl tracking-wide leading-tight">{p.nombre || p.cedula}</p>
                    <p className="text-xs opacity-50 font-medium">{p.cedula}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[1,2,3,4].map((est) => {
                        const pts = p[`estacion_${est}` as keyof Participante] as number
                        return pts > 0 ? (
                          <span key={est} className="text-xs font-semibold bg-black/15 rounded-full px-2 py-0.5 opacity-80">
                            E{est}: {pts}pts
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-3xl">{p.puntos_total}</p>
                  <p className="text-xs opacity-60 font-semibold">PTS</p>
                </div>
              </div>

              {/* Recuadro premio — mismo color */}
              <div className={`rounded-2xl px-4 py-3 shadow-md flex flex-col items-center justify-center text-center min-w-[140px] max-w-[160px] ${colorClase}`}>
                {premio.concierto && (
                  <p className="text-xs font-bold opacity-80 leading-tight mb-1">🎵 Entrada doble concierto</p>
                )}
                <p className="text-sm font-black leading-tight">⭐ {premio.puntos}</p>
              </div>
            </div>
          )
        })}

        {participantes.length === 0 && (
          <div className="text-center text-green-200 mt-10">
            <Star size={60} className="mx-auto mb-4 opacity-50" />
            <p className="text-2xl font-bold">¡El juego está por comenzar!</p>
            <p className="text-lg opacity-70 mt-2">Los participantes aparecerán aquí en tiempo real</p>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <p className="text-white/50 text-xs font-medium tracking-wide">Plataforma Desarrollada por:</p>
        <Image src="/logo-social.png" alt="Social Experience" width={90} height={36} className="object-contain opacity-50" />
      </div>
    </main>
  )
}
