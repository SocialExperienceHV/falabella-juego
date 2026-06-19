'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, UserPlus, User, Loader2 } from 'lucide-react'

type Estado = 'idle' | 'loading' | 'nuevo' | 'existente' | 'duplicado' | 'exito' | 'error'

const ESTACIONES = [
  { id: 1, nombre: 'Estación 1' },
  { id: 2, nombre: 'Estación 2' },
  { id: 3, nombre: 'Estación 3' },
]

export default function PromotorPage() {
  const [cedula, setCedula] = useState('')
  const [puntos, setPuntos] = useState('')
  const [estacion, setEstacion] = useState<number>(1)
  const [estado, setEstado] = useState<Estado>('idle')
  const [esNuevo, setEsNuevo] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const validarCedula = (value: string) => {
    return /^\d{6,12}$/.test(value)
  }

  const handleCedulaBlur = async () => {
    if (!validarCedula(cedula)) return
    setEstado('loading')
    const { data } = await supabase
      .from('participantes')
      .select('cedula, estacion_1, estacion_2, estacion_3, estacion_4')
      .eq('cedula', cedula)
      .single()

    if (data) {
      setEsNuevo(false)
      const yaJugo = (data as Record<string, number>)[`estacion_${estacion}`] > 0
      setEstado(yaJugo ? 'duplicado' : 'existente')
    } else {
      setEsNuevo(true)
      setEstado('nuevo')
    }
  }

  const handleEnviar = async () => {
    if (!validarCedula(cedula)) {
      setMensaje('Ingresa una cédula válida (6 a 12 dígitos)')
      setEstado('error')
      return
    }
    const puntosNum = parseInt(puntos)
    if (isNaN(puntosNum) || puntosNum < 0 || puntosNum > 100) {
      setMensaje('Ingresa un puntaje válido entre 0 y 100')
      setEstado('error')
      return
    }

    if (estado === 'duplicado') {
      setMensaje(`Esta persona ya participó en la Estación ${estacion}.`)
      setEstado('error')
      return
    }

    setEstado('loading')

    const columnaEstacion = `estacion_${estacion}` as 'estacion_1' | 'estacion_2' | 'estacion_3' | 'estacion_4'

    if (esNuevo) {
      const { error } = await supabase.from('participantes').insert({
        cedula,
        puntos_total: puntosNum,
        [columnaEstacion]: puntosNum,
      })
      if (error) {
        setMensaje('Error al registrar. Intenta de nuevo.')
        setEstado('error')
        return
      }
    } else {
      const { data: actual, error: fetchError } = await supabase
        .from('participantes')
        .select('puntos_total, ' + columnaEstacion)
        .eq('cedula', cedula)
        .single()

      if (fetchError || !actual) {
        setMensaje('Error al obtener datos. Intenta de nuevo.')
        setEstado('error')
        return
      }

      const actualData = actual as unknown as { puntos_total: number }

      const { error } = await supabase
        .from('participantes')
        .update({
          puntos_total: actualData.puntos_total + puntosNum,
          [columnaEstacion]: puntosNum,
          updated_at: new Date().toISOString(),
        })
        .eq('cedula', cedula)

      if (error) {
        setMensaje('Error al actualizar. Intenta de nuevo.')
        setEstado('error')
        return
      }
    }

    setMensaje(`✅ ${puntosNum} puntos asignados a cédula ${cedula}`)
    setEstado('exito')
    setCedula('')
    setPuntos('')
    setEsNuevo(false)
    setTimeout(() => setEstado('idle'), 3000)
  }

  const resetear = () => {
    setCedula('')
    setPuntos('')
    setEstado('idle')
    setEsNuevo(false)
    setMensaje('')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center pb-16">
      {/* Header */}
      <div className="w-full bg-[#007733] px-6 py-4 flex items-center justify-between mb-6">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={110} height={40} className="object-contain" />
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={80} height={40} className="object-contain" />
      </div>
      <div className="w-full max-w-md px-4">
      <h1 className="text-xl font-bold text-[#007733] mb-4 text-center">App Promotor</h1>

      {/* Selector de estación */}
      <div className="w-full max-w-md mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tu estación</label>
        <div className="grid grid-cols-3 gap-2">
          {ESTACIONES.map((e) => (
            <button
              key={e.id}
              onClick={() => { setEstacion(e.id); if (estado === 'existente' || estado === 'duplicado') handleCedulaBlur() }}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                estacion === e.id
                  ? 'bg-[#007733] text-white shadow-md scale-105'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {e.id}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">Estación seleccionada: {estacion}</p>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">

        {/* Cédula */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Número de cédula</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Ej: 1012345678"
              value={cedula}
              onChange={(e) => {
                setCedula(e.target.value)
                setEstado('idle')
                setEsNuevo(false)
              }}
              onBlur={handleCedulaBlur}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#007733] transition-colors text-gray-900"
            />
            {estado === 'loading' && (
              <Loader2 className="absolute right-3 top-3.5 text-gray-400 animate-spin" size={22} />
            )}
          </div>

          {/* Badge: nuevo o existente */}
          {estado === 'nuevo' && (
            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-2 text-sm font-semibold">
              <UserPlus size={18} />
              ¡Usuario NUEVO! Primera vez en el evento.
            </div>
          )}
          {estado === 'existente' && (
            <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 text-[#007733] rounded-xl px-3 py-2 text-sm font-semibold">
              <User size={18} />
              Usuario ya registrado. Puede participar en esta estación.
            </div>
          )}
          {estado === 'duplicado' && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 rounded-xl px-3 py-2 text-sm font-semibold">
              <AlertCircle size={18} />
              Esta persona ya participó en la Estación {estacion}. No puede repetir.
            </div>
          )}
          {!validarCedula(cedula) && cedula.length > 0 && (
            <p className="text-red-500 text-xs mt-1">La cédula debe tener entre 6 y 12 dígitos</p>
          )}
        </div>

        {/* Puntos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Puntos obtenidos</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 20, 25, 30].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPuntos(String(val))}
                className={`py-3 rounded-xl font-bold text-lg transition-all ${
                  puntos === String(val)
                    ? 'bg-[#007733] text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Botón enviar */}
        <button
          onClick={handleEnviar}
          disabled={estado === 'loading' || estado === 'duplicado' || !cedula || !puntos}
          className="w-full bg-[#007733] text-white font-bold text-lg py-4 rounded-xl disabled:opacity-40 active:scale-95 transition-all"
        >
          {estado === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} /> Enviando...
            </span>
          ) : (
            'Asignar Puntos'
          )}
        </button>

        {/* Feedback */}
        {estado === 'exito' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
            <CheckCircle size={20} />
            {mensaje}
          </div>
        )}
        {estado === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
            <AlertCircle size={20} />
            {mensaje}
          </div>
        )}

        <button onClick={resetear} className="text-gray-400 text-sm underline text-center">
          Limpiar formulario
        </button>
      </div>
      </div>
    </main>
  )
}
