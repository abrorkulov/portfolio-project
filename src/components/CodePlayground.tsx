import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Play, Copy, Check, Terminal } from 'lucide-react'

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

export default function CodePlayground() {
  const [code, setCode] = useState(defaultCode)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const runCode = () => {
    setIsRunning(true)
    setOutput([])

    // Capture console.log output
    const logs: string[] = []
    const originalLog = console.log

    console.log = (...args: any[]) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
      originalLog.apply(console, args)
    }

    try {
      // Create a function from the code
      const func = new Function(code)
      func()
      setOutput(logs.length > 0 ? logs : ['Code executed successfully (no output)'])
    } catch (error) {
      setOutput([`Error: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      console.log = originalLog
      setIsRunning(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetCode = () => {
    setCode(defaultCode)
    setOutput([])
  }

  return (
    <div className="glass-card glow-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-signal/20 to-pulse/20 p-2 border border-signal/30">
            <Code2 className="h-5 w-5 text-signal" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink">Code Playground</h3>
            <p className="font-mono text-xs text-ink-muted">Write & Run JavaScript/TypeScript</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            className="rounded-lg bg-void-surface border border-white/10 p-2 text-ink-muted hover:text-signal transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetCode}
            className="rounded-lg bg-void-surface border border-white/10 p-2 text-ink-muted hover:text-pulse transition-colors"
          >
            <Terminal className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor */}
        <div className="relative">
          <div className="absolute top-2 left-3 flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 rounded-lg bg-void-surface border border-white/5 p-4 pt-10 font-mono text-sm text-ink resize-none focus:outline-none focus:border-signal/30 transition-colors"
            placeholder="Write your JavaScript code here..."
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="relative">
          <div className="absolute top-2 left-3 flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-signal/80" />
          </div>
          <div className="w-full h-64 rounded-lg bg-void-surface border border-white/5 p-4 pt-10 font-mono text-sm overflow-auto">
            {output.length === 0 ? (
              <p className="text-ink-faint italic">// Output will appear here</p>
            ) : (
              output.map((line, i) => (
                <p
                  key={i}
                  className={`mb-1 ${line.startsWith('Error:') ? 'text-red-400' : 'text-signal'}`}
                >
                  {line}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={runCode}
        disabled={isRunning}
        className="mt-4 w-full glow-border rounded-xl bg-gradient-to-r from-signal/20 to-pulse/20 border border-signal/30 px-6 py-3 font-mono text-sm text-signal flex items-center justify-center gap-2 transition-all hover:from-signal/30 hover:to-pulse/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play className="h-4 w-4" />
        {isRunning ? 'Running...' : 'Run Code'}
      </motion.button>
    </div>
  )
}
