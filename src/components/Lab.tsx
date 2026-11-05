import { useEffect, useMemo, useRef, useState } from 'react'
import Scramble from './Scramble'
import { BASE, LOCK_OFFSET, PROGRAM, boot, disassemble, hex, step } from '../lib/x86'
import type { Cpu } from '../lib/x86'
import { prefersReducedMotion } from '../lib/env'
import { lab } from '../data/site'

type Props = {
  onCracked: () => void
}

const BYTES_PER_ROW = 8
const WATCHABLE_STEPS = 24

const parseKey = (raw: string) => {
  const clean = raw.replace(/^0x/i, '')
  if (!/^[0-9a-f]{1,8}$/i.test(clean)) return 0
  return parseInt(clean, 16) >>> 0
}

const printable = (byte: number) => (byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : '.')

export default function Lab({ onCracked }: Props) {
  const [mem, setMem] = useState<number[]>(() => [...PROGRAM])
  const [key, setKey] = useState('0000')
  const [cpu, setCpu] = useState<Cpu>(() => boot(0))
  const [running, setRunning] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [hint, setHint] = useState(0)
  const [log, setLog] = useState<string[]>(['loaded crackme.bin at 0x401000'])
  const [method, setMethod] = useState<'key' | 'patch' | null>(null)

  const ops = useMemo(() => disassemble(mem), [mem])
  const patched = useMemo(() => mem.some((byte, i) => byte !== PROGRAM[i]), [mem])
  const memRef = useRef(mem)
  memRef.current = mem

  const say = (line: string) => setLog((all) => [...all.slice(-4), line])

  const finish = (end: Cpu, usedPatch: boolean) => {
    if (end.fault) {
      say(`fault: ${end.fault}`)
      return
    }
    say(`ret, eax = 0x${hex(end.eax)}`)
    if (end.eax === 1) {
      say('access granted')
      setMethod(usedPatch ? 'patch' : 'key')
      onCracked()
    } else {
      say('access denied')
    }
  }

  /** Any change to the program invalidates a run in progress. */
  const restart = (nextKey = key) => {
    setRunning(false)
    setCpu(boot(parseKey(nextKey)))
  }

  const onStep = () => {
    setRunning(false)
    setCpu((current) => step(current.halted ? boot(parseKey(key)) : current, memRef.current))
  }

  const onRun = () => {
    say(`run, key = 0x${hex(parseKey(key), 4)}`)
    const fresh = boot(parseKey(key))
    if (prefersReducedMotion()) {
      let c = fresh
      while (!c.halted) c = step(c, memRef.current)
      setCpu(c)
      return
    }
    setCpu(fresh)
    setRunning(true)
  }

  // A run is a timer rather than a loop so the highlight can be watched going
  // down the listing and taking, or missing, the jump.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setCpu((current) => {
        let next = step(current, memRef.current)
        // Slow enough to follow for a run of this length. Past that it is a
        // patched loop, and nobody needs to watch it hit the limit a step at a time.
        if (next.steps > WATCHABLE_STEPS) {
          while (!next.halted) next = step(next, memRef.current)
        }
        if (next.halted) setRunning(false)
        return next
      })
    }, 230)
    return () => window.clearInterval(id)
  }, [running])

  // The one place a finished run is reported, whichever button got it there.
  // It watches the state rather than being called from the updaters, because
  // StrictMode runs updaters twice and the verdict would be logged twice.
  const reported = useRef<Cpu | null>(null)
  useEffect(() => {
    if (!cpu.halted || reported.current === cpu) return
    reported.current = cpu
    finish(cpu, patched)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpu])

  const commitByte = (value: string) => {
    if (editing === null) return
    if (/^[0-9a-f]{2}$/i.test(value)) {
      const byte = parseInt(value, 16)
      const at = editing
      if (byte !== mem[at]) {
        setMem((all) => all.map((b, i) => (i === at ? byte : b)))
        say(`patched 0x${hex(BASE + at, 6)}: ${hex(mem[at], 2)} -> ${hex(byte, 2)}`)
        restart()
      }
    }
    setEditing(null)
    setDraft('')
  }

  const beginEdit = (index: number) => {
    setEditing(index)
    setDraft(hex(mem[index], 2))
  }

  const patchForMe = () => {
    const next = mem.map((byte, i) => (i === LOCK_OFFSET ? 0x74 : byte))
    setMem(next)
    memRef.current = next
    say('patched 0x40100D: 75 -> 74')
    say(`run, key = 0x${hex(parseKey(key), 4)}`)
    const fresh = boot(parseKey(key))
    if (prefersReducedMotion()) {
      let c = fresh
      while (!c.halted) c = step(c, next)
      setCpu(c)
      return
    }
    setCpu(fresh)
    setRunning(true)
  }

  const fullReset = () => {
    setMem([...PROGRAM])
    memRef.current = [...PROGRAM]
    setKey('0000')
    setRunning(false)
    setCpu(boot(0))
    setHint(0)
    setMethod(null)
    setEditing(null)
    setLog(['loaded crackme.bin at 0x401000'])
  }

  const rows: number[][] = []
  for (let i = 0; i < mem.length; i += BYTES_PER_ROW) {
    rows.push(mem.slice(i, i + BYTES_PER_ROW))
  }

  const lockPulse = hint > 0 && !patched
  const granted = method !== null

  return (
    <section id="lab" className="lab" data-theme="dark">
      <header className="lab-head">
        <p className="kicker">
          <Scramble text={lab.kicker} />
        </p>
        <h2 className="lab-title" data-reveal>
          {lab.title.map((line) => (
            <span key={line} className="ln">
              <span>{line}</span>
            </span>
          ))}
        </h2>
        <p className="lab-intro" data-reveal>
          {lab.intro}
        </p>
      </header>

      {/* The reveal observer writes a class straight onto its node, and React
          owns className: a state-driven class on the same element wipes the
          reveal, and the debugger vanished at the exact moment it was beaten. */}
      <div data-reveal>
        <div className={granted ? 'debugger is-granted' : 'debugger'}>
          <div className="dbg-bar">
            <span className="dbg-file">{lab.file}</span>
            <label className="dbg-key">
              <span>{lab.keyLabel}</span>
              <span className="dbg-key-field">
                0x
                <input
                  value={key}
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={8}
                  aria-label="Key, in hexadecimal"
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9a-f]/gi, '').toUpperCase()
                    setKey(value)
                    restart(value)
                  }}
                />
              </span>
            </label>
            <div className="dbg-actions">
              <button type="button" onClick={onStep} disabled={running}>
                Step
              </button>
              <button type="button" className="is-primary" onClick={onRun} disabled={running}>
                Run
              </button>
              <button type="button" onClick={fullReset}>
                Reset
              </button>
            </div>
          </div>

          <div className="dbg-grid">
            <div className="dbg-pane dbg-asm">
              <p className="dbg-label">Disassembly</p>
              <ol>
                {ops.map((op) => {
                  const current = op.addr === cpu.eip && !cpu.halted
                  const changed = op.bytes.some((b, i) => b !== PROGRAM[op.addr - BASE + i])
                  return (
                    <li
                      key={op.addr}
                      className={[current ? 'is-eip' : '', changed ? 'is-patched' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="asm-addr">{hex(op.addr, 6)}</span>
                      <span className="asm-bytes">{op.bytes.map((b) => hex(b, 2)).join(' ')}</span>
                      <span className="asm-text">{op.text}</span>
                      <span className="asm-note">{op.comment ? `; ${op.comment}` : ''}</span>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="dbg-pane dbg-regs">
              <p className="dbg-label">Registers</p>
              <dl>
                <div>
                  <dt>EAX</dt>
                  <dd>{hex(cpu.eax)}</dd>
                </div>
                <div>
                  <dt>EIP</dt>
                  <dd>{hex(cpu.eip)}</dd>
                </div>
                <div>
                  <dt>ZF</dt>
                  <dd>{cpu.zf ? '1' : '0'}</dd>
                </div>
                <div>
                  <dt>[EBP+8]</dt>
                  <dd>{hex(cpu.key)}</dd>
                </div>
              </dl>
            </div>

            <div className="dbg-pane dbg-hex">
              <p className="dbg-label">Hex. Click a byte to patch it</p>
              <div className="hex-rows">
                {rows.map((row, r) => (
                  <div key={r} className="hex-row">
                    <span className="asm-addr">{hex(BASE + r * BYTES_PER_ROW, 6)}</span>
                    <span className="hex-bytes">
                      {row.map((byte, c) => {
                        const index = r * BYTES_PER_ROW + c
                        if (editing === index) {
                          return (
                            <input
                              key={index}
                              className="hex-input"
                              value={draft}
                              autoFocus
                              maxLength={2}
                              spellCheck={false}
                              aria-label={`Byte at offset ${index}`}
                              onFocus={(event) => event.target.select()}
                              onChange={(event) => {
                                const value = event.target.value
                                  .replace(/[^0-9a-f]/gi, '')
                                  .toUpperCase()
                                setDraft(value)
                                if (value.length === 2) commitByte(value)
                              }}
                              onBlur={() => commitByte(draft)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') commitByte(draft)
                                if (event.key === 'Escape') {
                                  setEditing(null)
                                  setDraft('')
                                }
                              }}
                            />
                          )
                        }
                        const classes = ['hex-byte']
                        if (byte !== PROGRAM[index]) classes.push('is-patched')
                        if (lockPulse && index === LOCK_OFFSET) classes.push('is-pulse')
                        return (
                          <button
                            key={index}
                            type="button"
                            className={classes.join(' ')}
                            aria-label={`Byte ${hex(byte, 2)} at 0x${hex(BASE + index, 6)}, edit`}
                            onClick={() => beginEdit(index)}
                          >
                            {hex(byte, 2)}
                          </button>
                        )
                      })}
                    </span>
                    <span className="hex-ascii" aria-hidden="true">
                      {row.map(printable).join('')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dbg-pane dbg-log" aria-live="polite">
              <p className="dbg-label">Output</p>
              <ol>
                {log.map((line, i) => (
                  <li key={`${i}-${line}`}>{line}</li>
                ))}
              </ol>
              <div className="dbg-help">
                {hint > 0 && !granted ? (
                  <p>{lab.hints[Math.min(hint, lab.hints.length) - 1]}</p>
                ) : null}
                {hint < lab.hints.length ? (
                  <button type="button" onClick={() => setHint(hint + 1)}>
                    {lab.hintButton}
                  </button>
                ) : !granted ? (
                  <button type="button" onClick={patchForMe} disabled={running}>
                    {lab.autoButton}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="dbg-granted" aria-hidden={!granted}>
            <p className="dbg-granted-title">{lab.granted}</p>
            <p className="dbg-granted-note">
              {method === 'key' ? lab.byKey : lab.byPatch} {lab.grantedNote}
            </p>
          </div>
        </div>
      </div>

      <div className="notes">
        <div className="notes-left" data-reveal>
          <p className="kicker">{lab.writeup.kicker}</p>
          <h3 className="notes-title">{lab.writeup.title}</h3>
          <blockquote>
            <p>“{lab.writeup.quote}”</p>
            <cite>{lab.writeup.quoteSource}</cite>
          </blockquote>
          <p className="notes-body">{lab.writeup.body}</p>
          <a className="notes-link" href={lab.writeup.repo} target="_blank" rel="noreferrer">
            {lab.writeup.repoLabel}
          </a>
        </div>
        <ul className="notes-modules" data-reveal>
          {lab.writeup.modules.map((module) => (
            <li key={module.file}>
              <span>{module.file}</span>
              <span>{module.does}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
