import { useCallback, useRef } from 'react'
import Scramble from './Scramble'
import { useScrollProgress } from '../lib/scroll'
import { stack } from '../data/site'

const COUNT = stack.layers.length

/** No lorem: the routes, tables and functions on these plates are from the real repos. */
function Art({ id }: { id: string }) {
  switch (id) {
    case 'interface':
      return (
        <div className="art art-ui">
          <i className="ui-bar" />
          <i className="ui-hero" />
          <div className="ui-row">
            <i />
            <i />
            <i />
          </div>
          <i className="ui-cta" />
        </div>
      )
    case 'services':
      return (
        <pre className="art art-code">
          {`GET   /api/health
POST  /api/auth/login
GET   /api/services
POST  /api/orders
POST  /api/orders/:id/pay
POST  /api/staff/orders/:id/claim`}
        </pre>
      )
    case 'data':
      return (
        <div className="art art-db">
          <div>
            <b>users</b>
            <i>phone</i>
            <i>role</i>
            <i>active</i>
          </div>
          <div>
            <b>orders</b>
            <i>status</i>
            <i>kutilmoqda</i>
            <i>yo_lda</i>
            <i>bajarildi</i>
          </div>
          <div>
            <b>doctors</b>
            <i>user_id</i>
            <i>verified</i>
            <i>rating</i>
          </div>
        </div>
      )
    case 'infra':
      return (
        <div className="art art-infra">
          <div>web</div>
          <div>api</div>
          <div>postgres</div>
          <p>docker compose up</p>
        </div>
      )
    case 'native':
      return (
        <pre className="art art-code">
          {`template <typename T>
bool ReadMemory(DWORD64 addr, T& value)
{
  SIZE_T read = 0;
  return ReadProcessMemory(
    hProcess, (LPCVOID)addr,
    &value, sizeof(T), &read);
}`}
        </pre>
      )
    case 'memory':
      return (
        <pre className="art art-code art-hex">
          {`7FF6A1C04D20  48 8B 05 C1 7E 21
7FF6A1C04D26  00 48 85 C0 74 3A
7FF6A1C04D2C  8B 88 44 03 00 00
7FF6A1C04D32  89 4C 24 30 48 8B
7FF6A1C04D38  5C 24 38 48 83 C4
7FF6A1C04D3E  20 5F C3 CC CC CC`}
        </pre>
      )
    default:
      return (
        <pre className="art art-code">
          {`8B 45 08        mov eax, [ebp+8]
35 5A 5A 00 00  xor eax, 0x5A5A
3D 37 13 00 00  cmp eax, 0x1337
75 06           jne 0x401015
B8 01 00 00 00  mov eax, 0x1
C3              ret`}
        </pre>
      )
  }
}

export default function Descent() {
  const root = useRef<HTMLElement>(null)
  const plates = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const ticks = useRef<HTMLOListElement>(null)
  const lastActive = useRef(-1)

  const onProgress = useCallback((p: number) => {
    // A plateau at each layer, so the reader gets time on a layer rather than
    // sliding through all of them at a constant rate.
    const raw = p * (COUNT - 1)
    const whole = Math.floor(raw)
    const frac = raw - whole
    const eased = frac * frac * (3 - 2 * frac)
    const at = Math.min(COUNT - 1, whole + Math.min(1, Math.max(0, (eased - 0.2) / 0.6)))

    const nodes = plates.current?.children
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as HTMLElement
        const d = i - at
        // Above the current layer: lifted clear and gone. Below: packed tight.
        const z = d < 0 ? -d * 260 : -d * 46
        const opacity = d < 0 ? Math.max(0, 1 + d * 1.25) : Math.max(0.1, 1 - d * 0.17)
        node.style.transform = `translate3d(0, 0, ${z}px)`
        node.style.opacity = String(opacity)
        node.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
      }
    }

    const active = Math.round(at)
    if (active !== lastActive.current) {
      lastActive.current = active
      const mark = (list: HTMLCollection | undefined) => {
        if (!list) return
        for (let i = 0; i < list.length; i++) list[i].classList.toggle('is-active', i === active)
      }
      mark(nodes)
      mark(copy.current?.children)
      mark(ticks.current?.children)
    }
  }, [])
  useScrollProgress(root, onProgress, { smooth: 0.12 })

  return (
    <section id="stack" ref={root} className="descent" data-theme="dark">
      <div className="descent-sticky">
        <div className="descent-rail">
          <p className="kicker">
            <Scramble text={stack.kicker} />
          </p>
          <ol ref={ticks} className="descent-ticks" aria-hidden="true">
            {stack.layers.map((layer) => (
              <li key={layer.id}>{layer.level}</li>
            ))}
          </ol>
        </div>

        <div ref={copy} className="descent-copy">
          {stack.layers.map((layer) => (
            <div key={layer.id} className="layer">
              <h3 className="layer-title">
                <span className="ln">
                  <span>{layer.title}</span>
                </span>
              </h3>
              <p className="layer-body">{layer.body}</p>
              <ul className="layer-tools">
                {layer.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="descent-scene" aria-hidden="true">
          <div ref={plates} className="plates">
            {stack.layers.map((layer) => (
              <div key={layer.id} className="plate">
                <span className="plate-level">{layer.level}</span>
                <Art id={layer.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
