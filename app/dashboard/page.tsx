'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase, Participante } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Users, Star, Award, Clock } from 'lucide-react'

type DatosHora = { hora: string; participantes: number }

export default function DashboardPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState('')

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

  // Métricas
  const total = participantes.length
  const porEstacion = [1, 2, 3, 4].map((e) => ({
    estacion: e === 4 ? 'Trivia' : `Estación ${e}`,
    count: participantes.filter((p) => (p[`estacion_${e}` as keyof Participante] as number) > 0).length,
  }))
  const puntosEntregados = participantes.reduce((sum, p) => sum + p.puntos_total, 0)

  // Análisis por hora
  const porHora: Record<string, number> = {}
  participantes.forEach((p) => {
    if (!p.created_at) return
    const hora = new Date(p.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
    const horaRedondeada = hora.slice(0, 2) + ':00'
    porHora[horaRedondeada] = (porHora[horaRedondeada] || 0) + 1
  })
  const datosHora: DatosHora[] = Object.entries(porHora)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, participantes]) => ({ hora, participantes }))

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-[#007733] px-6 py-4 flex items-center justify-between">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={120} height={45} className="object-contain" />
        <div className="text-right">
          <Image src="/logo-copa.png" alt="Copa Bienestar" width={80} height={40} className="object-contain ml-auto" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#007733]">Dashboard de Participación</h1>
          <p className="text-xs text-gray-400">Actualizado: {ultimaActualizacion}</p>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users size={24} className="text-[#007733]" />}
            label="Total participantes"
            valor={total}
            color="bg-green-50 border-green-200"
          />
          <MetricCard
            icon={<Star size={24} className="text-yellow-500" />}
            label="Puntos entregados"
            valor={puntosEntregados}
            color="bg-yellow-50 border-yellow-200"
          />
          <MetricCard
            icon={<Award size={24} className="text-blue-500" />}
            label="Promedio de puntos"
            valor={total > 0 ? Math.round(puntosEntregados / total) : 0}
            color="bg-blue-50 border-blue-200"
            sufijo=" pts"
          />
          <MetricCard
            icon={<Clock size={24} className="text-purple-500" />}
            label="Completaron trivia"
            valor={participantes.filter((p) => p.estacion_4 > 0).length}
            color="bg-purple-50 border-purple-200"
          />
        </div>

        {/* Participantes por estación */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Participantes por estación</h2>
          <div className="grid grid-cols-4 gap-3">
            {porEstacion.map((e) => (
              <div key={e.estacion} className="flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 rounded-xl overflow-hidden h-32 flex items-end">
                  <div
                    className="w-full bg-[#007733] rounded-t-xl transition-all duration-700 flex items-center justify-center"
                    style={{ height: total > 0 ? `${Math.max((e.count / total) * 100, 8)}%` : '8%' }}
                  >
                    <span className="text-white font-black text-lg">{e.count}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-600 text-center">{e.estacion}</p>
                <p className="text-xs text-gray-400">
                  {total > 0 ? Math.round((e.count / total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico por hora */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Participación por hora</h2>
          {datosHora.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosHora} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hora" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="participantes" fill="#007733" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">Aún no hay datos de participación</p>
          )}
        </div>

        {/* Tabla top 10 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top 10 participantes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">Cédula</th>
                  <th className="pb-2 font-semibold text-center">Est. 1</th>
                  <th className="pb-2 font-semibold text-center">Est. 2</th>
                  <th className="pb-2 font-semibold text-center">Est. 3</th>
                  <th className="pb-2 font-semibold text-center">Trivia</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...participantes]
                  .sort((a, b) => b.puntos_total - a.puntos_total)
                  .slice(0, 10)
                  .map((p, i) => (
                    <tr key={p.cedula} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-400 font-bold">{i + 1}</td>
                      <td className="py-2.5 font-semibold text-gray-800">{p.cedula}</td>
                      <td className="py-2.5 text-center">{p.estacion_1 || '—'}</td>
                      <td className="py-2.5 text-center">{p.estacion_2 || '—'}</td>
                      <td className="py-2.5 text-center">{p.estacion_3 || '—'}</td>
                      <td className="py-2.5 text-center">{p.estacion_4 || '—'}</td>
                      <td className="py-2.5 text-right font-black text-[#007733]">{p.puntos_total}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-gray-400 text-xs">Plataforma Desarrollada por:</p>
          <Image src="/logo-social.png" alt="Social Experience" width={90} height={36} className="object-contain opacity-50" />
        </div>
      </div>
    </main>
  )
}

function MetricCard({ icon, label, valor, color, sufijo = '' }: {
  icon: React.ReactNode
  label: string
  valor: number
  color: string
  sufijo?: string
}) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${color}`}>
      {icon}
      <p className="text-2xl font-black text-gray-800">{valor}{sufijo}</p>
      <p className="text-xs text-gray-500 font-semibold leading-tight">{label}</p>
    </div>
  )
}
