'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase, Participante } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, Star, Award, Zap, RefreshCw } from 'lucide-react'

type DatosHora = { hora: string; participantes: number }

export default function DashboardPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState('')
  const [pulsing, setPulsing] = useState(false)

  const cargar = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) {
      setParticipantes(data)
      setUltimaActualizacion(new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
      setPulsing(true)
      setTimeout(() => setPulsing(false), 600)
    }
  }

  useEffect(() => {
    cargar()
    const canal = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, cargar)
      .subscribe()
    const intervalo = setInterval(cargar, 10000)
    return () => { supabase.removeChannel(canal); clearInterval(intervalo) }
  }, [])

  const total = participantes.length
  const puntosEntregados = participantes.reduce((sum, p) => sum + p.puntos_total, 0)
  const promedio = total > 0 ? Math.round(puntosEntregados / total) : 0
  const triviaCount = participantes.filter((p) => p.estacion_4 > 0).length

  const porEstacion = [
    { label: 'Estación 1', count: participantes.filter(p => p.estacion_1 > 0).length },
    { label: 'Estación 2', count: participantes.filter(p => p.estacion_2 > 0).length },
    { label: 'Estación 3', count: participantes.filter(p => p.estacion_3 > 0).length },
    { label: 'Trivia', count: triviaCount },
  ]

  const porHora: Record<string, number> = {}
  participantes.forEach((p) => {
    if (!p.created_at) return
    const h = new Date(p.created_at).getHours()
    const key = `${String(h).padStart(2, '0')}:00`
    porHora[key] = (porHora[key] || 0) + 1
  })
  const datosHora: DatosHora[] = Object.entries(porHora)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, participantes]) => ({ hora, participantes }))

  const top10 = [...participantes].sort((a, b) => b.puntos_total - a.puntos_total).slice(0, 10)

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white pb-16">

      {/* Header */}
      <div className="bg-[#007733] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Image src="/logo-banco.png" alt="Banco Falabella" width={120} height={45} className="object-contain" />
          <div className="h-6 w-px bg-white/30" />
          <Image src="/logo-copa.png" alt="Copa Bienestar" width={75} height={38} className="object-contain" />
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <RefreshCw size={12} className={pulsing ? 'animate-spin text-white' : ''} />
          {ultimaActualizacion}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard de Participación</h1>
          <p className="text-white/40 text-sm mt-1">Copa Bienestar · Actualización en tiempo real</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users size={20} />}
            label="Participantes"
            valor={total}
            color="from-[#007733] to-[#00a844]"
          />
          <KpiCard
            icon={<Star size={20} />}
            label="Puntos entregados"
            valor={puntosEntregados}
            color="from-[#1a3a6b] to-[#2563eb]"
          />
          <KpiCard
            icon={<Award size={20} />}
            label="Promedio de puntos"
            valor={promedio}
            sufijo=" pts"
            color="from-[#5b21b6] to-[#7c3aed]"
          />
          <KpiCard
            icon={<Zap size={20} />}
            label="Completaron trivia"
            valor={triviaCount}
            color="from-[#92400e] to-[#d97706]"
          />
        </div>

        {/* Estaciones + Gráfico */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Participantes por estación */}
          <div className="bg-[#0d1526] rounded-2xl border border-white/10 p-6">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-5">Por estación</h2>
            <div className="flex flex-col gap-3">
              {porEstacion.map((e) => {
                const pct = total > 0 ? Math.round((e.count / total) * 100) : 0
                return (
                  <div key={e.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70 font-semibold">{e.label}</span>
                      <span className="font-black text-white">{e.count} <span className="text-white/30 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#007733] to-[#00ff88] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gráfico por hora */}
          <div className="bg-[#0d1526] rounded-2xl border border-white/10 p-6">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-5">Participación por hora</h2>
            {datosHora.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={datosHora} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a2744', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                  />
                  <Line type="monotone" dataKey="participantes" stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-white/30 text-sm">
                Aún no hay datos
              </div>
            )}
          </div>
        </div>

        {/* Top 10 */}
        <div className="bg-[#0d1526] rounded-2xl border border-white/10 p-6">
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-5">Top 10 participantes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/30 border-b border-white/10">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Cédula</th>
                  <th className="pb-3 font-semibold text-center">Est. 1</th>
                  <th className="pb-3 font-semibold text-center">Est. 2</th>
                  <th className="pb-3 font-semibold text-center">Est. 3</th>
                  <th className="pb-3 font-semibold text-center">Trivia</th>
                  <th className="pb-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((p, i) => (
                  <tr key={p.cedula} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white/30 font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="py-3 font-semibold text-white">{p.cedula}</td>
                    <td className="py-3 text-center text-white/60">{p.estacion_1 || '—'}</td>
                    <td className="py-3 text-center text-white/60">{p.estacion_2 || '—'}</td>
                    <td className="py-3 text-center text-white/60">{p.estacion_3 || '—'}</td>
                    <td className="py-3 text-center text-white/60">{p.estacion_4 || '—'}</td>
                    <td className="py-3 text-right font-black text-[#00ff88] text-base">{p.puntos_total}</td>
                  </tr>
                ))}
                {top10.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-white/30">Aún no hay participantes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-white/20 text-xs">Plataforma Desarrollada por:</p>
          <Image src="/logo-social.png" alt="Social Experience" width={90} height={36} className="object-contain opacity-30 brightness-0 invert" />
        </div>
      </div>
    </main>
  )
}

function KpiCard({ icon, label, valor, color, sufijo = '' }: {
  icon: React.ReactNode
  label: string
  valor: number
  color: string
  sufijo?: string
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} p-5 flex flex-col gap-3`}>
      <div className="text-white/70">{icon}</div>
      <div>
        <p className="text-3xl font-black text-white">{valor.toLocaleString('es-CO')}{sufijo}</p>
        <p className="text-xs text-white/60 font-semibold mt-1">{label}</p>
      </div>
    </div>
  )
}
