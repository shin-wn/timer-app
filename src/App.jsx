import { useState, useEffect, useRef, useCallback } from 'react'

const TIME_PRESETS = [
  { label: '3h',  seconds: 3 * 3600, type: 'h' },
  { label: '2h',  seconds: 2 * 3600, type: 'h' },
  { label: '1h',  seconds: 3600,     type: 'h' },
  { label: '30m', seconds: 30 * 60,  type: 'm' },
  { label: '15m', seconds: 15 * 60,  type: 'm' },
  { label: '10m', seconds: 10 * 60,  type: 'm' },
  { label: '5m',  seconds: 5 * 60,   type: 'm' },
  { label: '3m',  seconds: 3 * 60,   type: 'm' },
  { label: '1m',  seconds: 60,       type: 'm' },
  { label: '30s', seconds: 30,       type: 's' },
  { label: '10s', seconds: 10,       type: 's' },
  { label: '1s',  seconds: 1,        type: 's' },
]

const PRESET_STYLES = {
  h: 'text-violet-700 bg-violet-100 hover:bg-violet-200',
  m: 'text-blue-700   bg-blue-100   hover:bg-blue-200',
  s: 'text-slate-600  bg-slate-100  hover:bg-slate-200',
}

const SOUNDS = [
  { id: 'beep',  label: 'ビープ',   repeatAfter: 1500 },
  { id: 'bell',  label: 'ベル',     repeatAfter: 3500 },
  { id: 'alarm', label: 'アラーム', repeatAfter: 2000 },
  { id: 'chime', label: 'チャイム', repeatAfter: 3200 },
]

function playSound(type) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  const ctx = new AudioCtx()

  const note = (freq, oscType, startOffset, duration, peak = 0.4) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = oscType
    osc.frequency.value = freq
    const t = ctx.currentTime + startOffset
    gain.gain.setValueAtTime(peak, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  }

  if (type === 'beep') {
    [0, 0.25, 0.5].forEach(t => note(880, 'square', t, 0.18, 0.3))
  } else if (type === 'bell') {
    note(523.25, 'sine', 0, 2.5, 0.5)
    note(1046.5, 'sine', 0, 1.2, 0.12)
  } else if (type === 'alarm') {
    for (let i = 0; i < 8; i++) {
      note(i % 2 === 0 ? 880 : 1100, 'sawtooth', i * 0.15, 0.13, 0.2)
    }
  } else if (type === 'chime') {
    [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      note(freq, 'sine', i * 0.2, 0.6, 0.35)
    })
  }

  setTimeout(() => ctx.close(), 4000)
}

function App() {
  const [inputMinutes, setInputMinutes] = useState(0)
  const [inputSeconds, setInputSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [selectedSound, setSelectedSound] = useState('beep')
  const [isAlarmRinging, setIsAlarmRinging] = useState(false)
  const intervalRef = useRef(null)
  const alarmLoopRef = useRef(null)

  const totalInputSeconds = inputMinutes * 60 + inputSeconds

  const displayTime = timeLeft !== null ? timeLeft : totalInputSeconds
  const displayMinutes = Math.floor(displayTime / 60)
  const displaySeconds = displayTime % 60

  const progressPercent =
    timeLeft !== null && totalInputSeconds > 0
      ? ((totalInputSeconds - timeLeft) / totalInputSeconds) * 100
      : 0

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stopAlarm = useCallback(() => {
    if (alarmLoopRef.current) {
      clearInterval(alarmLoopRef.current)
      alarmLoopRef.current = null
    }
    setIsAlarmRinging(false)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          setIsFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning, clearTimer])

  useEffect(() => {
    if (!isFinished) return
    const sound = SOUNDS.find(s => s.id === selectedSound)
    playSound(selectedSound)
    setIsAlarmRinging(true)
    alarmLoopRef.current = setInterval(() => playSound(selectedSound), sound.repeatAfter)
    return () => {
      clearInterval(alarmLoopRef.current)
      alarmLoopRef.current = null
    }
  }, [isFinished]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    if (isFinished) return
    if (timeLeft === null) {
      if (totalInputSeconds === 0) return
      setTimeLeft(totalInputSeconds)
    }
    setIsRunning(true)
  }

  const handleStop = () => {
    clearTimer()
    setIsRunning(false)
  }

  const handleReset = () => {
    clearTimer()
    stopAlarm()
    setIsRunning(false)
    setIsFinished(false)
    setTimeLeft(null)
  }

  const handleMinutesChange = (e) => {
    const val = Math.max(0, Math.min(99, Number(e.target.value)))
    setInputMinutes(val)
    handleReset()
  }

  const handleSecondsChange = (e) => {
    const val = Math.max(0, Math.min(59, Number(e.target.value)))
    setInputSeconds(val)
    handleReset()
  }

  const handleAddPreset = (seconds) => {
    const total = Math.min(inputMinutes * 60 + inputSeconds + seconds, 99 * 60 + 59)
    setInputMinutes(Math.floor(total / 60))
    setInputSeconds(total % 60)
    handleReset()
  }

  const handleClearTime = () => {
    setInputMinutes(0)
    setInputSeconds(0)
    handleReset()
  }

  const ringR = 52
  const ringCirc = 2 * Math.PI * ringR

  return (
    <div
      className={`min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8 2xl:p-12 ${isAlarmRinging ? 'cursor-pointer' : ''}`}
      onClick={() => { if (isAlarmRinging) stopAlarm() }}
    >
      <div className="w-full max-w-sm lg:max-w-2xl xl:max-w-4xl 2xl:max-w-6xl">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:flex lg:divide-x lg:divide-slate-200">

          {/* ── Left panel: ring ── */}
          <div className="flex flex-col items-center justify-center px-8 pt-8 pb-6
                          lg:flex-1 lg:py-14 lg:px-12
                          xl:py-16 xl:px-16
                          2xl:py-20 2xl:px-20">
            <h1 className="text-slate-400 text-xs font-semibold tracking-[0.25em] uppercase
                           mb-8 lg:mb-10 2xl:mb-12 2xl:text-sm">
              Timer
            </h1>

            {/* Ring */}
            <div className="relative
                            w-52 h-52
                            lg:w-72 lg:h-72
                            xl:w-80 xl:h-80
                            2xl:w-[26rem] 2xl:h-[26rem]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={ringR}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                />
                <circle
                  cx="60" cy="60" r={ringR}
                  fill="none"
                  stroke={isFinished ? '#ef4444' : '#3b82f6'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringCirc * (1 - progressPercent / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isFinished ? (
                  <span className="text-red-500 font-semibold tracking-[0.15em] uppercase
                                   text-sm lg:text-base 2xl:text-xl">
                    時間切れ
                  </span>
                ) : (
                  <span className="text-slate-800 font-mono font-light tabular-nums
                                   text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                    {String(displayMinutes).padStart(2, '0')}
                    <span className="text-slate-300">:</span>
                    {String(displaySeconds).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel: controls ── */}
          <div className="flex flex-col justify-center
                          px-6 pb-8 gap-6
                          lg:flex-1 lg:p-10 lg:gap-7
                          xl:p-12 xl:gap-8
                          2xl:p-14 2xl:gap-9">

            {/* Preset buttons */}
            <div>
              <p className="text-slate-400 text-xs tracking-[0.2em] uppercase
                             mb-2.5 2xl:mb-3 2xl:text-sm">
                時間を追加
              </p>
              <div className="flex flex-wrap gap-2 2xl:gap-2.5">
                {TIME_PRESETS.map(({ label, seconds, type }) => (
                  <button
                    key={label}
                    onClick={() => handleAddPreset(seconds)}
                    disabled={isRunning}
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed
                               2xl:px-5 2xl:py-2.5 2xl:text-base 2xl:rounded-xl
                               ${PRESET_STYLES[type]}`}
                  >
                    +{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input controls */}
            <div>
              <p className="text-slate-400 text-xs tracking-[0.2em] uppercase
                             mb-2.5 2xl:mb-3 2xl:text-sm">
                時間を設定
              </p>
              <div className="flex items-center gap-4 2xl:gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <label className="text-slate-400 text-xs tracking-widest uppercase 2xl:text-sm">分</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={inputMinutes}
                    onChange={handleMinutesChange}
                    disabled={isRunning}
                    className="text-center text-slate-800 font-mono
                               w-20 text-2xl lg:w-24 lg:text-3xl 2xl:w-32 2xl:text-4xl
                               bg-slate-50 border border-slate-200 rounded-xl py-2 px-1
                               focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
                               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
                <span className="text-slate-300 font-light mt-5 text-3xl 2xl:text-4xl">:</span>
                <div className="flex flex-col items-center gap-1.5">
                  <label className="text-slate-400 text-xs tracking-widest uppercase 2xl:text-sm">秒</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputSeconds}
                    onChange={handleSecondsChange}
                    disabled={isRunning}
                    className="text-center text-slate-800 font-mono
                               w-20 text-2xl lg:w-24 lg:text-3xl 2xl:w-32 2xl:text-4xl
                               bg-slate-50 border border-slate-200 rounded-xl py-2 px-1
                               focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
                               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Sound selector */}
            <div>
              <p className="text-slate-400 text-xs tracking-[0.2em] uppercase
                             mb-2.5 2xl:mb-3 2xl:text-sm">
                アラーム音
              </p>
              <div className="flex gap-2 2xl:gap-3">
                {SOUNDS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => { setSelectedSound(id); playSound(id) }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors
                                2xl:py-2.5 2xl:text-sm 2xl:rounded-xl
                                ${selectedSound === id
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-500'
                                }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 2xl:gap-4">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold
                             py-3 rounded-xl transition-colors
                             2xl:py-4 2xl:text-lg 2xl:rounded-2xl"
                >
                  一時停止
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={totalInputSeconds === 0 || isFinished}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold
                             py-3 rounded-xl transition-colors shadow-sm
                             disabled:opacity-40 disabled:cursor-not-allowed
                             2xl:py-4 2xl:text-lg 2xl:rounded-2xl"
                >
                  スタート
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800
                           font-semibold py-3 rounded-xl border border-slate-200 transition-colors
                           2xl:py-4 2xl:text-lg 2xl:rounded-2xl"
              >
                リセット
              </button>
              <button
                onClick={handleClearTime}
                disabled={isRunning}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800
                           font-semibold font-mono py-3 rounded-xl border border-slate-200 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           2xl:py-4 2xl:text-lg 2xl:rounded-2xl"
              >
                00:00
              </button>
            </div>

          </div>
        </div>

        {/* Alert */}
        {isFinished && (
          <div className="mt-3 2xl:mt-4 bg-red-50 border border-red-200 rounded-xl px-6 py-3 2xl:py-4 text-center">
            <p className="text-red-500 font-semibold text-sm 2xl:text-base tracking-wide">時間になりました</p>
            {isAlarmRinging && (
              <p className="text-red-400 text-xs 2xl:text-sm mt-1 tracking-wide">画面をクリックしてアラームを停止</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default App
