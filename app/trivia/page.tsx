'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Loader2, Trophy } from 'lucide-react'

const PREGUNTAS = [
  {
    pregunta: '¿Qué área del Banco se encarga de comunicar y posicionar nuestras marcas y productos?',
    opciones: ['Marketing', 'Medios de Pago', 'CMR Puntos', 'Operaciones'],
    correcta: 0,
  },
  {
    pregunta: '¿Cuál de los siguientes beneficios obtienes al usar tu Tarjeta CMR Banco Falabella?',
    opciones: [
      'Acumular CMR Puntos por tus compras',
      'Acceso a préstamos hipotecarios',
      'Descuentos en todas las compras en efectivo',
      'Exclusivamente seguros de vida',
    ],
    correcta: 0,
  },
  {
    pregunta: '¿Qué funcionalidad te permite realizar pagos y transferencias desde la App Banco Falabella?',
    opciones: ['CMR Puntos', 'Medios de Pago', 'Crédito Personal', 'Seguros Falabella'],
    correcta: 1,
  },
  {
    pregunta: '¿Qué beneficio ofrece CMR Puntos al acumular puntos en tus compras?',
    opciones: [
      'Canjear productos, viajes, experiencias y más',
      'Acceder a descuentos exclusivos en comercios aliados',
      'Obtener avances en efectivo sin costo',
      'Pagar la cuota de tu Tarjeta CMR en cualquier cajero',
    ],
    correcta: 0,
  },
  {
    pregunta: '¿Cuál de las siguientes opciones te permite canjear tus CMR Puntos?',
    opciones: [
      'Viajes, experiencias y panoramas',
      'Productos en Falabella y sus marcas asociadas',
      'Pago de la tarjeta CMR',
      'Donaciones a fundaciones',
      'Todas las anteriores',
    ],
    correcta: 4,
  },
]

const LETRAS = ['A', 'B', 'C', 'D', 'E']
const PUNTOS_POR_PREGUNTA = 12

type Fase = 'cedula' | 'jugando' | 'guardando' | 'finalizado' | 'error' | 'ya_jugo'

export default function TriviaPage() {
  const [fase, setFase] = useState<Fase>('cedula')
  const [cedula, setCedula] = useState('')
  const [cedulaError, setCedulaError] = useState('')
  const [loadingCedula, setLoadingCedula] = useState(false)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(Array(PREGUNTAS.length).fill(null))
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [respondida, setRespondida] = useState(false)
  const [puntosGanados, setPuntosGanados] = useState(0)
  const [mensajeError, setMensajeError] = useState('')

  const validarCedula = (v: string) => /^\d{6,12}$/.test(v)

  const handleIniciar = async () => {
    if (!validarCedula(cedula)) {
      setCedulaError('Ingresa una cédula válida (6 a 12 dígitos)')
      return
    }
    setLoadingCedula(true)
    setCedulaError('')

    const { data } = await supabase
      .from('participantes')
      .select('estacion_4')
      .eq('cedula', cedula)
      .single()

    setLoadingCedula(false)

    if (data && data.estacion_4 > 0) {
      setFase('ya_jugo')
      return
    }

    setFase('jugando')
  }

  const handleSeleccionar = (idx: number) => {
    if (respondida) return
    setSeleccion(idx)
    setRespondida(true)
  }

  const handleSiguiente = async () => {
    const nuevasRespuestas = [...respuestas]
    nuevasRespuestas[preguntaActual] = seleccion
    setRespuestas(nuevasRespuestas)
    setSeleccion(null)
    setRespondida(false)

    if (preguntaActual < PREGUNTAS.length - 1) {
      setPreguntaActual(preguntaActual + 1)
    } else {
      const correctas = nuevasRespuestas.filter((r, i) => r === PREGUNTAS[i].correcta).length
      const pts = correctas * PUNTOS_POR_PREGUNTA
      setPuntosGanados(pts)
      await guardarPuntos(pts)
    }
  }

  const guardarPuntos = async (pts: number) => {
    setFase('guardando')

    const { data: actual } = await supabase
      .from('participantes')
      .select('puntos_total')
      .eq('cedula', cedula)
      .single()

    let error
    if (actual) {
      const res = await supabase
        .from('participantes')
        .update({
          puntos_total: actual.puntos_total + pts,
          estacion_4: pts,
          updated_at: new Date().toISOString(),
        })
        .eq('cedula', cedula)
      error = res.error
    } else {
      const res = await supabase.from('participantes').insert({
        cedula,
        puntos_total: pts,
        estacion_4: pts,
      })
      error = res.error
    }

    if (error) {
      setMensajeError('Error al guardar los puntos. Inténtalo de nuevo.')
      setFase('error')
    } else {
      setFase('finalizado')
    }
  }

  const resetear = () => {
    setFase('cedula')
    setCedula('')
    setCedulaError('')
    setPreguntaActual(0)
    setRespuestas(Array(PREGUNTAS.length).fill(null))
    setSeleccion(null)
    setRespondida(false)
    setPuntosGanados(0)
  }

  const pregunta = PREGUNTAS[preguntaActual]

  return (
    <main className="min-h-screen bg-[#007733] flex flex-col items-center pb-12">
      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between mb-2">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={110} height={40} className="object-contain" />
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={80} height={40} className="object-contain" />
      </div>

      <div className="w-full max-w-lg px-4 flex flex-col gap-6">
        {/* Título */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">TRIVIA</h1>
          <p className="text-green-300 text-sm mt-1">Estación 4 · 2 puntos por respuesta correcta</p>
        </div>

        {/* FASE: Ingresar cédula */}
        {fase === 'cedula' && (
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-gray-700 font-semibold text-center">Ingresa tu número de cédula para comenzar</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Ej: 1012345678"
              value={cedula}
              onChange={(e) => { setCedula(e.target.value); setCedulaError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleIniciar()}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#007733] text-gray-900"
            />
            {cedulaError && <p className="text-red-500 text-sm font-semibold">{cedulaError}</p>}
            <button
              onClick={handleIniciar}
              disabled={loadingCedula || !cedula}
              className="w-full bg-[#007733] text-white font-bold text-lg py-4 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loadingCedula ? <><Loader2 className="animate-spin" size={20} /> Verificando...</> : '¡Comenzar Trivia!'}
            </button>
          </div>
        )}

        {/* FASE: Ya jugó */}
        {fase === 'ya_jugo' && (
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">🚫</span>
            <p className="font-bold text-gray-800 text-lg">Ya participaste en la Trivia</p>
            <p className="text-gray-500 text-sm">La cédula <strong>{cedula}</strong> ya completó la Estación 4.</p>
            <button onClick={resetear} className="text-[#007733] underline text-sm font-semibold">Ingresar otra cédula</button>
          </div>
        )}

        {/* FASE: Jugando */}
        {fase === 'jugando' && (
          <div className="flex flex-col gap-4">
            {/* Progreso */}
            <div className="flex items-center gap-2">
              {PREGUNTAS.map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < preguntaActual ? 'bg-yellow-400' : i === preguntaActual ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <p className="text-green-300 text-xs text-right font-semibold">Pregunta {preguntaActual + 1} de {PREGUNTAS.length}</p>

            {/* Tarjeta de pregunta */}
            <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
              <p className="font-bold text-gray-800 text-lg leading-snug">{pregunta.pregunta}</p>

              <div className="flex flex-col gap-2">
                {pregunta.opciones.map((op, i) => {
                  const esSeleccionada = seleccion === i
                  const esCorrecta = i === pregunta.correcta
                  let estilo = 'border-gray-200 text-gray-700 hover:border-[#007733]/40'
                  let estiloLetra = 'bg-gray-100 text-gray-500'

                  if (respondida) {
                    if (esCorrecta) {
                      estilo = 'border-green-500 bg-green-50 text-green-800'
                      estiloLetra = 'bg-green-500 text-white'
                    } else if (esSeleccionada) {
                      estilo = 'border-red-400 bg-red-50 text-red-700'
                      estiloLetra = 'bg-red-400 text-white'
                    } else {
                      estilo = 'border-gray-100 text-gray-400 opacity-50'
                    }
                  } else if (esSeleccionada) {
                    estilo = 'border-[#007733] bg-[#007733]/10 text-[#007733]'
                    estiloLetra = 'bg-[#007733] text-white'
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSeleccionar(i)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all font-semibold text-sm ${estilo}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${estiloLetra}`}>
                        {LETRAS[i]}
                      </span>
                      {op}
                    </button>
                  )
                })}
              </div>

              {respondida && (
                <p className={`text-center font-bold text-sm ${seleccion === pregunta.correcta ? 'text-green-600' : 'text-red-500'}`}>
                  {seleccion === pregunta.correcta ? `¡Correcto! +${PUNTOS_POR_PREGUNTA} puntos` : `Incorrecto. La respuesta era: ${pregunta.opciones[pregunta.correcta]}`}
                </p>
              )}

              <button
                onClick={handleSiguiente}
                disabled={!respondida}
                className="w-full bg-[#007733] text-white font-bold py-3 rounded-xl disabled:opacity-40 transition-all"
              >
                {preguntaActual < PREGUNTAS.length - 1 ? 'Siguiente pregunta →' : 'Finalizar'}
              </button>
            </div>
          </div>
        )}

        {/* FASE: Guardando */}
        {fase === 'guardando' && (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[#007733]" />
            <p className="font-semibold text-gray-600">Guardando tus puntos...</p>
          </div>
        )}

        {/* FASE: Finalizado */}
        {fase === 'finalizado' && (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <Trophy size={56} className="text-yellow-500" />
            <p className="text-2xl font-black text-[#007733]">¡Listo!</p>
            <p className="text-gray-700 font-semibold">
              Se sumaron <strong>{puntosGanados} puntos</strong> a tu marcador en el ranking.
            </p>
            <p className="text-gray-400 text-sm">Cédula: {cedula}</p>
            <button
              onClick={resetear}
              className="mt-2 text-[#007733] underline text-sm font-semibold"
            >
              Siguiente participante
            </button>
          </div>
        )}

        {/* FASE: Error */}
        {fase === 'error' && (
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="font-bold text-gray-800">{mensajeError}</p>
            <button onClick={() => guardarPuntos(puntosGanados)} className="bg-[#007733] text-white font-bold py-3 px-6 rounded-xl">
              Reintentar
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 mt-4">
          <p className="text-white/40 text-xs">Plataforma Desarrollada por:</p>
          <Image src="/logo-social.png" alt="Social Experience" width={80} height={32} className="object-contain opacity-40" />
        </div>
      </div>
    </main>
  )
}
