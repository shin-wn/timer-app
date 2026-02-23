import { useState, useEffect, useRef, useCallback } from 'react'

const TIME_PRESETS = [
  { label: '3h', seconds: 3 * 3600 },
  { label: '2h', seconds: 2 * 3600 },
  { label: '1h', seconds: 3600 },
  { label: '30m', seconds: 30 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '10m', seconds: 10 * 60 },
  { label: '5m', seconds: 5 * 60 },
  { label: '3m', seconds: 3 * 60 },
  { label: '1m', seconds: 60 },
  { label: '30s', seconds: 30 },
  { label: '10s', seconds: 10 },
]

function App() {
  const [inputMinutes, setInputMinutes] = useState(0)
  const [inputSeconds, setInputSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef(null)

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

  const isIdle = !isRunning && !isFinished

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <h1 className="text-white text-2xl font-bold tracking-widest uppercase opacity-80">
              Timer
            </h1>
          </div>

          {/* Progress ring + time display */}
          <div className="flex flex-col items-center px-8 py-6">
            <div className="relative w-56 h-56">
              {/* SVG progress ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Track */}
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke={isFinished ? '#f87171' : '#a78bfa'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Time text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isFinished ? (
                  <span className="text-red-400 text-lg font-bold animate-pulse">
                    時間切れ！
                  </span>
                ) : (
                  <span className="text-white text-5xl font-mono font-bold tabular-nums">
                    {String(displayMinutes).padStart(2, '0')}
                    <span className="opacity-60">:</span>
                    {String(displaySeconds).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap justify-center gap-2 px-6 pb-4">
            {TIME_PRESETS.map(({ label, seconds }) => (
              <button
                key={label}
                onClick={() => handleAddPreset(seconds)}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-bold text-purple-200 bg-purple-500/20 hover:bg-purple-500/40 active:bg-purple-500/60 border border-purple-400/30 rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +{label}
              </button>
            ))}
          </div>

          {/* Input controls */}
          <div className="flex items-center justify-center gap-4 px-8 pb-6">
            <div className="flex flex-col items-center gap-1">
              <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
                分
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={inputMinutes}
                onChange={handleMinutesChange}
                disabled={isRunning}
                className="w-20 text-center text-white text-2xl font-mono font-bold bg-white/10 border border-white/20 rounded-xl py-2 px-1 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              />
            </div>
            <span className="text-white/40 text-3xl font-bold mt-5">:</span>
            <div className="flex flex-col items-center gap-1">
              <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
                秒
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={inputSeconds}
                onChange={handleSecondsChange}
                disabled={isRunning}
                className="w-20 text-center text-white text-2xl font-mono font-bold bg-white/10 border border-white/20 rounded-xl py-2 px-1 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 px-8 pb-8">
            {/* Start / Stop */}
            {isRunning ? (
              <button
                onClick={handleStop}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-white font-bold py-3 rounded-2xl transition-all duration-150 shadow-lg shadow-yellow-500/30"
              >
                一時停止
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={totalInputSeconds === 0 || isFinished}
                className="flex-1 bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white font-bold py-3 rounded-2xl transition-all duration-150 shadow-lg shadow-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                スタート
              </button>
            )}

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-bold py-3 rounded-2xl border border-white/20 transition-all duration-150"
            >
              リセット
            </button>
          </div>
        </div>

        {/* Alert overlay */}
        {isFinished && (
          <div className="mt-4 bg-red-500/20 border border-red-400/50 rounded-2xl px-6 py-4 text-center animate-bounce">
            <p className="text-red-300 font-bold text-lg">⏰ 時間になりました！</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
