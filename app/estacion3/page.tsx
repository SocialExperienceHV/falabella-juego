'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2, Trophy } from 'lucide-react'

const FRASES = [
  { id: 1,  frase: 'Esa jugada va',                          palabras: 3, pista: 'Oportunidad en juego',          emoji: '👉⚽✅' },
  { id: 2,  frase: 'Descuento Sin Tope',                     palabras: 3, pista: 'Sin monto máximo',              emoji: '💸⬇️🚫🔝' },
  { id: 3,  frase: 'Redime tus CMR Puntos',                  palabras: 4, pista: 'Cambia puntos por premios',     emoji: '🔄🎁⭐' },
  { id: 4,  frase: 'El plan es la ofi',                      palabras: 5, pista: 'Venir a la oficina',            emoji: '📍💼🏢' },
  { id: 5,  frase: 'Acumula CMR Puntos',                     palabras: 3, pista: 'Sumar puntos comprando',        emoji: '➕⭐💳' },
  { id: 6,  frase: 'Activación de clientes',                 palabras: 3, pista: 'Clientes en acción',            emoji: '🚀👥' },
  { id: 7,  frase: 'Tarjetas aceptadas en todo el mundo',    palabras: 6, pista: 'Uso internacional',             emoji: '💳✅🌍' },
  { id: 8,  frase: 'Cuenta de Ahorros Plus',                 palabras: 4, pista: 'Ahorro con más beneficios',     emoji: '🏦💰➕' },
  { id: 9,  frase: 'Tarjeta CMR Black',                      palabras: 3, pista: 'Tarjeta premium',               emoji: '💳⚫⭐' },
  { id: 10, frase: 'Amo lo simple',                          palabras: 3, pista: 'Menos complicaciones',          emoji: '❤️👌' },
  { id: 11, frase: 'Alcancía Digital',                       palabras: 2, pista: 'Ahorro desde el celular',       emoji: '🐷📱' },
  { id: 12, frase: 'Burger King con 40%dto',                 palabras: 4, pista: 'Aliado con descuento',          emoji: '🍔👑4️⃣0️⃣⬇️' },
]

const PUNTOS_POR_ACIERTO = 10
const TOTAL_PREGUNTAS = 3
const TIEMPO = 30

function elegirAleatorias() {
  const copia = [...FRASES]
  const resultado = []
  for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
    const idx = Math.floor(Math.random() * copia.length)
    resultado.push(copia.splice(idx, 1)[0])
  }
  return resultado
}

type Fase = 'cedula' | 'jugando' | 'guardando' | 'finalizado' | 'ya_jugo'

export default function Estacion3Page() {
  const [fase, setFase] = useState<Fase>('cedula')
  const [cedula, setCedula] = useState('')
  const [cedulaError, setCedulaError] = useState('')
  const [loadingCedula, setLoadingCedula] = useState(false)
  const [preguntas, setPreguntas] = useState(elegirAleatorias())
  const [indice, setIndice] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [tiempo, setTiempo] = useState(TIEMPO)
  const [tiempoAgotado, setTiempoAgotado] = useState(false)
  const [resultado, setResultado] = useState<'correcto' | 'incorrecto' | 'tiempo' | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validarCedula = (v: string) => /^\d{6,12}$/.test(v)

  const iniciarTemporizador = () => {
    setTiempo(TIEMPO)
    setTiempoAgotado(false)
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    intervaloRef.current = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) {
          clearInterval(intervaloRef.current!)
          setTiempoAgotado(true)
          setResultado('tiempo')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current) }
  }, [])

  const handleIniciar = async () => {
    if (!validarCedula(cedula)) {
      setCedulaError('Ingresa una cédula válida (6 a 12 dígitos)')
      return
    }
    setLoadingCedula(true)
    setCedulaError('')

    const { data } = await supabase
      .from('participantes')
      .select('estacion_3')
      .eq('cedula', cedula)
      .single()

    setLoadingCedula(false)

    if (data && data.estacion_3 > 0) {
      setFase('ya_jugo')
      return
    }

    setPreguntas(elegirAleatorias())
    setIndice(0)
    setPuntos(0)
    setResultado(null)
    setFase('jugando')
    iniciarTemporizador()
  }

  const responder = (correcto: boolean) => {
    if (resultado !== null) return
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    const nuevoPuntos = correcto ? puntos + PUNTOS_POR_ACIERTO : puntos
    setPuntos(nuevoPuntos)
    setResultado(correcto ? 'correcto' : 'incorrecto')
  }

  const siguiente = async () => {
    const nuevoIndice = indice + 1
    setResultado(null)
    setTiempoAgotado(false)

    if (nuevoIndice >= TOTAL_PREGUNTAS) {
      await guardar(puntos)
    } else {
      setIndice(nuevoIndice)
      iniciarTemporizador()
    }
  }

  const guardar = async (pts: number) => {
    setFase('guardando')

    const { data: actual } = await supabase
      .from('participantes')
      .select('puntos_total')
      .eq('cedula', cedula)
      .single()

    if (actual) {
      await supabase.from('participantes').update({
        puntos_total: actual.puntos_total + pts,
        estacion_3: pts,
        updated_at: new Date().toISOString(),
      }).eq('cedula', cedula)
    } else {
      await supabase.from('participantes').insert({
        cedula,
        puntos_total: pts,
        estacion_3: pts,
      })
    }

    setFase('finalizado')
  }

  const resetear = () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    setCedula('')
    setCedulaError('')
    setPuntos(0)
    setIndice(0)
    setResultado(null)
    setTiempoAgotado(false)
    setFase('cedula')
  }

  const preguntaActual = preguntas[indice]
  const enRojo = tiempo <= 5 && tiempo > 0 && resultado === null

  return (
    <main className="min-h-screen bg-[#007733] flex flex-col items-center pb-12">
      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between mb-2">
        <Image src="/logo-banco.png" alt="Banco Falabella" width={110} height={40} className="object-contain" />
        <Image src="/logo-copa.png" alt="Copa Bienestar" width={80} height={40} className="object-contain" />
      </div>

      <div className="w-full max-w-lg px-4 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">JUGADAS EN CLAVE</h1>
          <p className="text-green-300 text-sm mt-1">Estación 3 · 10 puntos por respuesta correcta</p>
        </div>

        {/* CEDULA */}
        {fase === 'cedula' && (
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-gray-700 font-semibold text-center">Ingresa la cédula del participante</p>
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
              {loadingCedula ? <><Loader2 className="animate-spin" size={20} /> Verificando...</> : '¡Iniciar Juego!'}
            </button>
          </div>
        )}

        {/* YA JUGÓ */}
        {fase === 'ya_jugo' && (
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">🚫</span>
            <p className="font-bold text-gray-800 text-lg">Ya participó en esta estación</p>
            <p className="text-gray-500 text-sm">La cédula <strong>{cedula}</strong> ya completó la Estación 3.</p>
            <button onClick={resetear} className="text-[#007733] underline text-sm font-semibold">Ingresar otra cédula</button>
          </div>
        )}

        {/* JUGANDO */}
        {fase === 'jugando' && preguntaActual && (
          <div className="flex flex-col gap-4">
            {/* Progreso */}
            <div className="flex items-center gap-2">
              {preguntas.map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < indice ? 'bg-yellow-400' : i === indice ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <p className="text-green-300 text-xs text-right font-semibold">Pregunta {indice + 1} de {TOTAL_PREGUNTAS}</p>

            {/* Tarjeta de pregunta */}
            <div className="bg-white rounded-2xl p-6 flex flex-col gap-5">
              {/* Temporizador */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiempo</span>
                <div className={`text-5xl font-black tabular-nums transition-colors ${enRojo ? 'text-red-500 animate-pulse' : 'text-[#007733]'}`}>
                  {String(tiempo).padStart(2, '0')}s
                </div>
              </div>

              {resultado === null && !tiempoAgotado && (
                <>
                  {/* Emoji */}
                  <div className="text-center text-6xl py-2">{preguntaActual.emoji}</div>

                  {/* Pista y palabras */}
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-center">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Pista</p>
                    <p className="text-gray-800 font-bold text-lg">{preguntaActual.pista}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {Array.from({ length: preguntaActual.palabras }).map((_, i) => (
                        <div key={i} className="h-1 w-8 bg-[#007733] rounded-full" />
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{preguntaActual.palabras} {preguntaActual.palabras === 1 ? 'palabra' : 'palabras'}</p>
                  </div>

                  {/* Botones validación */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => responder(true)}
                      className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-all"
                    >
                      <CheckCircle size={22} /> Correcto
                    </button>
                    <button
                      onClick={() => responder(false)}
                      className="flex items-center justify-center gap-2 bg-red-400 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-all"
                    >
                      <XCircle size={22} /> Incorrecto
                    </button>
                  </div>
                </>
              )}

              {/* Resultado correcto */}
              {resultado === 'correcto' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span className="text-5xl">🎉</span>
                  <p className="text-green-600 font-black text-2xl">¡Correcto!</p>
                  <p className="text-gray-500 font-semibold">+{PUNTOS_POR_ACIERTO} puntos</p>
                  <button
                    onClick={siguiente}
                    className="mt-2 w-full bg-[#007733] text-white font-bold py-3 rounded-xl"
                  >
                    {indice + 1 < TOTAL_PREGUNTAS ? 'Siguiente →' : 'Ver resultado'}
                  </button>
                </div>
              )}

              {/* Resultado incorrecto */}
              {resultado === 'incorrecto' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span className="text-5xl">😔</span>
                  <p className="text-red-500 font-black text-2xl">Incorrecto</p>
                  <p className="text-gray-400 font-semibold">Sin puntos esta ronda</p>
                  <button
                    onClick={siguiente}
                    className="mt-2 w-full bg-[#007733] text-white font-bold py-3 rounded-xl"
                  >
                    {indice + 1 < TOTAL_PREGUNTAS ? 'Siguiente →' : 'Ver resultado'}
                  </button>
                </div>
              )}

              {/* Tiempo agotado */}
              {resultado === 'tiempo' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span className="text-5xl">⏰</span>
                  <p className="text-red-500 font-black text-2xl">¡Tiempo!</p>
                  <p className="text-gray-400 font-semibold">Sin puntos esta ronda</p>
                  <button
                    onClick={siguiente}
                    className="mt-2 w-full bg-[#007733] text-white font-bold py-3 rounded-xl"
                  >
                    {indice + 1 < TOTAL_PREGUNTAS ? 'Siguiente →' : 'Ver resultado'}
                  </button>
                </div>
              )}
            </div>

            {/* Puntaje parcial */}
            <div className="text-center text-white/60 text-sm font-semibold">
              Puntos acumulados: <span className="text-white font-black">{puntos}</span>
            </div>
          </div>
        )}

        {/* GUARDANDO */}
        {fase === 'guardando' && (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[#007733]" />
            <p className="font-semibold text-gray-600">Guardando puntos...</p>
          </div>
        )}

        {/* FINALIZADO */}
        {fase === 'finalizado' && (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <Trophy size={56} className="text-yellow-500" />
            <p className="text-2xl font-black text-[#007733]">¡Listo!</p>
            <p className="text-gray-700 font-semibold">
              Se sumaron <strong>{puntos} puntos</strong> en la Estación 3.
            </p>
            <p className="text-gray-400 text-sm">Cédula: {cedula}</p>
            <button onClick={resetear} className="mt-2 text-[#007733] underline text-sm font-semibold">
              Siguiente participante
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
