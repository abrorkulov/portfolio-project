/**
 * A tiny x86 emulator: enough real instructions to run the crackme, and to do
 * something sensible with whatever a visitor patches into it.
 *
 * The encodings are the real ones, so anything learned here holds on an actual
 * machine, and execution decodes at EIP every step rather than walking a
 * prepared list. That is what makes a patch honest: change a byte and the
 * program changes, including when a jump lands in the middle of an instruction.
 */

export const BASE = 0x401000

/**
 * int check(int key) {
 *   if ((key ^ 0x5A5A) == 0x1337) return 1
 *   return 0
 * }
 *
 * The key is 0x496D. The other way in is one byte: the JNE at +0x0D, 75 -> 74.
 */
export const PROGRAM = [
  0x8b, 0x45, 0x08, // mov  eax, [ebp+8]
  0x35, 0x5a, 0x5a, 0x00, 0x00, // xor  eax, 0x5A5A
  0x3d, 0x37, 0x13, 0x00, 0x00, // cmp  eax, 0x1337
  0x75, 0x06, // jne  denied
  0xb8, 0x01, 0x00, 0x00, 0x00, // mov  eax, 1
  0xc3, // ret
  0x31, 0xc0, // denied: xor eax, eax
  0xc3, // ret
]

/** Offset of the jump everyone should end up looking at. */
export const LOCK_OFFSET = 0x0d

const COMMENTS: Record<number, string> = {
  0x401000: 'your key',
  0x40100d: 'the whole lock',
  0x40100f: 'granted',
  0x401015: 'denied',
}

export type Op = {
  addr: number
  bytes: number[]
  text: string
  comment?: string
}

export type Cpu = {
  eax: number
  eip: number
  zf: boolean
  key: number
  steps: number
  halted: boolean
  fault?: string
}

/** Past this a patched jump is looping, and the run is stopped rather than hung. */
const STEP_LIMIT = 256

export const hex = (value: number, width = 8) =>
  (value >>> 0).toString(16).toUpperCase().padStart(width, '0')

const imm32 = (mem: number[], at: number) =>
  (mem[at] | (mem[at + 1] << 8) | (mem[at + 2] << 16) | (mem[at + 3] << 24)) >>> 0

/** rel8 is signed: 0xFE is -2, which is how EB FE spins forever. */
const rel8 = (byte: number) => (byte > 127 ? byte - 256 : byte)

export function decode(mem: number[], addr: number): Op | null {
  const at = addr - BASE
  if (at < 0 || at >= mem.length) return null
  const op = mem[at]

  const make = (length: number, text: string): Op | null => {
    if (at + length > mem.length) return null
    return { addr, bytes: mem.slice(at, at + length), text, comment: COMMENTS[addr] }
  }
  const jump = (name: string) => {
    if (at + 2 > mem.length) return null
    return make(2, `${name} 0x${hex(addr + 2 + rel8(mem[at + 1]), 6)}`)
  }

  switch (op) {
    case 0x8b:
      if (mem[at + 1] === 0x45) {
        const disp = rel8(mem[at + 2])
        return make(3, `mov eax, [ebp${disp < 0 ? '-' : '+'}${Math.abs(disp)}]`)
      }
      break
    case 0x31:
      if (mem[at + 1] === 0xc0) return make(2, 'xor eax, eax')
      break
    case 0x35:
      return make(5, `xor eax, 0x${hex(imm32(mem, at + 1), 4)}`)
    case 0x3d:
      return make(5, `cmp eax, 0x${hex(imm32(mem, at + 1), 4)}`)
    case 0xb8:
      return make(5, `mov eax, 0x${hex(imm32(mem, at + 1), 1)}`)
    case 0x40:
      return make(1, 'inc eax')
    case 0x48:
      return make(1, 'dec eax')
    case 0x74:
      return jump('je')
    case 0x75:
      return jump('jne')
    case 0xeb:
      return jump('jmp')
    case 0x90:
      return make(1, 'nop')
    case 0xc3:
      return make(1, 'ret')
  }
  return null
}

/** The linear sweep shown on screen. A byte that decodes to nothing is `db`. */
export function disassemble(mem: number[]): Op[] {
  const ops: Op[] = []
  let addr = BASE
  while (addr - BASE < mem.length) {
    const op = decode(mem, addr)
    if (op) {
      ops.push(op)
      addr += op.bytes.length
    } else {
      const byte = mem[addr - BASE]
      ops.push({ addr, bytes: [byte], text: `db 0x${hex(byte, 2)}` })
      addr += 1
    }
  }
  return ops
}

export function boot(key: number): Cpu {
  return { eax: 0, eip: BASE, zf: false, key, steps: 0, halted: false }
}

export function step(cpu: Cpu, mem: number[]): Cpu {
  if (cpu.halted) return cpu
  if (cpu.steps >= STEP_LIMIT) {
    return { ...cpu, halted: true, fault: `stopped after ${STEP_LIMIT} steps: it loops` }
  }

  const op = decode(mem, cpu.eip)
  if (!op) {
    const inRange = cpu.eip >= BASE && cpu.eip < BASE + mem.length
    return {
      ...cpu,
      halted: true,
      fault: inRange
        ? `illegal instruction at 0x${hex(cpu.eip, 6)}`
        : `access violation at 0x${hex(cpu.eip, 6)}`,
    }
  }

  const at = cpu.eip - BASE
  const code = mem[at]
  const next = cpu.eip + op.bytes.length
  const base = { ...cpu, eip: next, steps: cpu.steps + 1 }
  const target = () => next + rel8(mem[at + 1])

  switch (code) {
    case 0x8b:
      // [ebp+8] is the only argument on this stack; everything else reads as 0.
      return { ...base, eax: rel8(mem[at + 2]) === 8 ? cpu.key >>> 0 : 0 }
    case 0x31: {
      return { ...base, eax: 0, zf: true }
    }
    case 0x35: {
      const eax = (cpu.eax ^ imm32(mem, at + 1)) >>> 0
      return { ...base, eax, zf: eax === 0 }
    }
    case 0x3d:
      return { ...base, zf: cpu.eax >>> 0 === imm32(mem, at + 1) }
    case 0xb8:
      return { ...base, eax: imm32(mem, at + 1) }
    case 0x40: {
      const eax = (cpu.eax + 1) >>> 0
      return { ...base, eax, zf: eax === 0 }
    }
    case 0x48: {
      const eax = (cpu.eax - 1) >>> 0
      return { ...base, eax, zf: eax === 0 }
    }
    case 0x74:
      return cpu.zf ? { ...base, eip: target() } : base
    case 0x75:
      return cpu.zf ? base : { ...base, eip: target() }
    case 0xeb:
      return { ...base, eip: target() }
    case 0x90:
      return base
    case 0xc3:
      return { ...base, halted: true }
  }
  return { ...cpu, halted: true, fault: `illegal instruction at 0x${hex(cpu.eip, 6)}` }
}
