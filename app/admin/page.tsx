'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase, Participante } from '@/lib/supabase'
import { Search, Plus, Minus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type EstadoBusqueda = 'idle' | 'loading' | 'encontrado' | 'no_encontrado'

export default function AdminPage() {
  const [cedula, setCedula] = useState('')
  const [participante, setParticipante] = useState<Participante | null>(null)
  const [estadoBusqueda, setEstadoBusqueda] = useState<EstadoBusqueda>('idle')
  const [ajuste, setAjuste] = useState('')
  const [motivo, setMotivo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error'>('ok')
  const [guardando, setGuardando] = useState(false)
  const [reseteando, setReseteando] = useState(false)

  const resetearTodo = async () => {
    const confirmacion = prompt('Escribe RESET para confirmar que quieres borrar todos los datos del evento:')
    if (confirmacion !== 'RESET') return
    setReseteando(true)
    const { error } = await supabase.from('participantes').delete().neq('cedula', '')
    if (error) {
      alert('Error al resetear: ' + error.message)
    } else {
      setMensaje('✅ Todos los datos han sido eliminados. El evento está en ceros.')
      setTipoMensaje('ok')
      setParticipante(null)
      setCedula('')
      setEstadoBusqueda('idle')
    }
    setReseteando(false)
  }

  const buscar = async () => {
    if (!cedula) return
    setEstadoBusqueda('loading')
    setParticipante(null)
    setMensaje('')

    const { data } = await supabase
      .from('participantes')
      .select('*')
      .eq('cedula', cedula)
      .single()

    if (data) {
      setParticipante(data)
      setEstadoBusqueda('encontrado')
    } else {
      setEstadoBusqueda('no_encontrado')
    }
  }

  const aplicarAjuste = async (tipo: 'sumar' | 'restar') => {
    if (!participante) return
    const valor = parseInt(ajuste)
    if (isNaN(valor) || valor <= 0) {
      setMensaje('Ingresa un valor válido mayor a 0')
      setTipoMensaje('error')
      return
    }

    const nuevoPuntaje = tipo === 'sumar'
      ? participante.puntos_total + valor
      : Math.max(0, participante.puntos_total - valor)

    setGuardando(true)
    const { error } = await supabase
      .from('participantes')
      .update({ puntos_total: nuevoPuntaje, updated_at: new Date().toISOString() })
      .eq('cedula', participante.cedula)

    if (error) {
      setMensaje('Error al actualizar. Intenta de nuevo.')
      setTipoMensaje('error')
    } else {
      setParticipante({ ...participante, puntos_total: nuevoPuntaje })
      setMensaje(`Puntos ${tipo === 'sumar' ? 'sumados' : 'restados'} correctamente. Total: ${nuevoPuntaje} pts`)
      setTipoMensaje('ok')
      setAjuste('')
      setMotivo('')
    }
    setGuardando(false)
  }

return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center pb-16">
      {/* Header */}
      <div className="w-full bg-[#007733] px-6 py-4 flex items-center justify-between mb-6">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={110} height={40} className="object-contain" />
        <span className="text-white font-bold text-sm bg-white/20 px-3 py-1 rounded-full">Super Admin</span>
      </div>

      <div className="w-full max-w-md px-4 flex flex-col gap-5">
        <h1 className="text-xl font-bold text-[#007733] text-center">Panel de Administración</h1>

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">Buscar por cédula</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Número de cédula"
              value={cedula}
              onChange={(e) => { setCedula(e.target.value); setEstadoBusqueda('idle'); setParticipante(null) }}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-[#007733]"
            />
            <button
              onClick={buscar}
              disabled={estadoBusqueda === 'loading' || !cedula}
              className="bg-[#007733] text-white px-4 py-2.5 rounded-xl disabled:opacity-40"
            >
              {estadoBusqueda === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
          </div>

          {estadoBusqueda === 'no_encontrado' && (
            <p className="text-red-500 text-sm font-semibold">No se encontró ningún participante con esa cédula.</p>
          )}
        </div>

        {/* Resultado */}
        {participante && (
          <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Participante encontrado</p>
              <p className="text-2xl font-black text-gray-800">{participante.cedula}</p>
              <p className="text-4xl font-black text-[#007733] mt-1">{participante.puntos_total} <span className="text-lg font-semibold text-gray-400">pts totales</span></p>
            </div>

            {/* Desglose por estación */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((e) => {
                const pts = participante[`estacion_${e}` as keyof Participante] as number
                return (
                  <div key={e} className={`rounded-xl p-2 text-center ${pts > 0 ? 'bg-[#007733]/10 text-[#007733]' : 'bg-gray-100 text-gray-400'}`}>
                    <p className="text-xs font-semibold">Est. {e}</p>
                    <p className="text-lg font-black">{pts}</p>
                  </div>
                )
              })}
            </div>

            {/* Ajuste de puntos */}
            <div className="border-t pt-4 flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">Ajustar puntos totales</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Cantidad de puntos"
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                min={1}
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-[#007733]"
              />
              <input
                type="text"
                placeholder="Motivo del ajuste (opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#007733]"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => aplicarAjuste('sumar')}
                  disabled={guardando || !ajuste}
                  className="flex items-center justify-center gap-2 bg-[#007733] text-white font-bold py-3 rounded-xl disabled:opacity-40"
                >
                  <Plus size={18} /> Sumar
                </button>
                <button
                  onClick={() => aplicarAjuste('restar')}
                  disabled={guardando || !ajuste}
                  className="flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-40"
                >
                  <Minus size={18} /> Restar
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Resetear evento */}
        <div className="bg-white rounded-2xl shadow p-5 border-2 border-red-100">
          <p className="text-sm font-bold text-red-600 mb-1">⚠️ Zona de peligro</p>
          <p className="text-xs text-gray-500 mb-3">Borra todos los participantes y puntos. Úsalo solo antes de iniciar el evento real.</p>
          <button
            onClick={resetearTodo}
            disabled={reseteando}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-40 hover:bg-red-600 transition-colors"
          >
            {reseteando ? 'Reseteando...' : '🗑️ Resetear todo el evento'}
          </button>
        </div>

        {/* Feedback */}
        {mensaje && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
            tipoMensaje === 'ok'
              ? 'bg-green-50 border border-green-300 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {tipoMensaje === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {mensaje}
          </div>
        )}
      </div>
    </main>
  )
}
