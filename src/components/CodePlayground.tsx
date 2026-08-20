import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2,
  Play,
  Copy,
  Check,
  RotateCcw,
  TerminalSquare,
} from 'lucide-react'
import Panel from './Panel'
import { ease } from '../lib/motion'

const defaultCode = `// Try some JavaScript!
const greeting = "Hello, World!";
const numbers = [1, 2, 3, 4, 5];

// Map and filter
const doubled = numbers
  .map(n => n * 2)
  .filter(n => n > 4);

console.log(greeting);
console.log("Doubled numbers:", doubled);

// Calculate sum
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);`

type OutputLine = { text: string; kind: 'log' | 'error' | 'info' }

export default function CodePlayground() {
  const [code, setCode] = useState(defaultCode)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const lineCount = useMemo(() => code.split('\n').length, [code])

  const runCode = () => {
    setIsRunning(true)
    setOutput([])

    const logs: OutputLine[] = []
    const originalLog = console.log

    console.log = (...args: unknown[]) => {
      logs.push({
        text: args
          .map((arg) =>
            typeof arg === 'object' && arg !== null
              ? JSON.stringify(arg, null, 2)
              : String(arg),
          )
          .join(' '),
        kind: 'log',
      })
      originalLog.apply(console, args)
    }

    try {
      const func = new Function(code)
      func()
      setOutput(
        logs.length > 0
          ? logs
          : [{ text: 'Executed successfully — no output.', kind: 'info' }],
      )
    } catch (error) {
      setOutput([
        {
          text: error instanceof Error ? error.message : String(error),
          kind: 'error',
        },
      ])
    } finally {
      console.log = originalLog
      setIsRunning(false)
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The clipboard API is unavailable over plain HTTP and in some embeds.
      setOutput([
        { text: 'Clipboard unavailable in this browser.', kind: 'info' },
      ])
    }
  }

  const resetCode = () => {
    setCode(defaultCode)
    setOutput([])
  }

  return (
    <Panel
      icon={Code2}
      title="Code Playground"
      subtitle="Write and run JavaScript right here"
      actions={
        <>
          <button
            onClick={copyCode}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-void-surface px-3 font-mono text-[11px] text-ink-muted transition-colors hover:text-signal"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={resetCode}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-void-surface px-3 font-mono text-[11px] text-ink-muted transition-colors hover:text-pulse"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {/* Editor */}
        <div className="inset-surface overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            </span>
            <span className="ml-1 font-mono text-[11px] text-ink-faint">
              scratch.js
            </span>
            <span className="ml-auto font-mono text-[10px] text-ink-faint">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
          </div>

          <label htmlFor="playground-code" className="sr-only">
            JavaScript code
          </label>
          <textarea
            id="playground-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-64 w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-faint sm:h-72"
            placeholder="Write your JavaScript here..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* Console */}
        <div className="inset-surface overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <TerminalSquare
              className="h-3.5 w-3.5 text-signal"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] text-ink-faint">
              console
            </span>
            {output.length > 0 && (
              <button
                onClick={() => setOutput([])}
                className="ml-auto font-mono text-[10px] text-ink-faint transition-colors hover:text-ink"
              >
                clear
              </button>
            )}
          </div>

          <div
            className="h-64 overflow-auto p-4 font-mono text-[13px] leading-relaxed sm:h-72"
            role="log"
            aria-live="polite"
          >
            {output.length === 0 ? (
              <p className="italic text-ink-faint">
                // Output will appear here
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {output.map((line, i) => (
                  <motion.p
                    key={`${i}-${line.text.slice(0, 24)}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: i * 0.03,
                      ease: ease.out,
                    }}
                    className={
                      'mb-1 whitespace-pre-wrap break-words ' +
                      (line.kind === 'error'
                        ? 'text-red-400'
                        : line.kind === 'info'
                          ? 'text-ink-muted'
                          : 'text-signal')
                    }
                  >
                    <span className="mr-2 select-none text-ink-faint">
                      {line.kind === 'error' ? '✕' : '›'}
                    </span>
                    {line.text}
                  </motion.p>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={runCode}
        disabled={isRunning}
        className="glow-border mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-signal/30 bg-gradient-to-r from-signal/20 to-pulse/20 px-6 font-mono text-sm text-signal transition-colors hover:from-signal/30 hover:to-pulse/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        {isRunning ? 'Running...' : 'Run Code'}
      </motion.button>
    </Panel>
  )
}
