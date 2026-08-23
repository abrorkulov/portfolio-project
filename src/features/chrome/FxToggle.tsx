import { Sparkles, Volume2, VolumeX } from 'lucide-react'
import { playTick, setFx, useFx } from '@/shared/lib/fx'
import { isLiteMotion } from '@/shared/motion/motion'
import { cn } from '@/shared/lib/utils'

/**
 * Two switches for the page's ambient effects, in the navbar.
 *
 * Almost every site that has a moving background gives you no way to stop it
 * short of turning on reduced-motion for your whole operating system, which is
 * a very large hammer for "the dots are distracting me". These are the small
 * hammer.
 *
 * The sound switch is the more interesting of the two, because sound on the
 * web is only ever acceptable as an opt-in. It is off by default, it stays off
 * across reloads unless it was deliberately turned on, and the very first
 * thing it does when enabled is play its own confirmation tick — so nobody can
 * switch it on without immediately hearing exactly what they signed up for.
 *
 * On the lite tier the particle switch is not rendered at all: there is no
 * particle field on that tier, and a control for something that does not exist
 * is worse than no control.
 */
export default function FxToggle({ className }: { className?: string }) {
  const { particles, sound } = useFx()

  const base =
    'grid h-9 w-9 place-items-center rounded-full border transition-colors duration-300 focus-visible:outline-none'
  const on = 'border-signal/35 bg-signal/10 text-signal hover:bg-signal/20'
  const off =
    'border-white/10 bg-white/[0.03] text-ink-faint hover:border-white/20 hover:text-ink-muted'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {!isLiteMotion && (
        <button
          type="button"
          onClick={() => {
            setFx({ particles: !particles })
            playTick('click')
          }}
          aria-pressed={particles}
          aria-label={
            particles
              ? 'Turn off ambient particles'
              : 'Turn on ambient particles'
          }
          title={particles ? 'Ambient effects on' : 'Ambient effects off'}
          className={cn(base, particles ? on : off)}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          const next = !sound
          setFx({ sound: next })
          // Order matters: `setFx` has to land before the tick, or the tick
          // reads the old value and the switch appears not to work.
          if (next) playTick('click')
        }}
        aria-pressed={sound}
        aria-label={sound ? 'Turn off interface sound' : 'Turn on interface sound'}
        title={sound ? 'Sound on' : 'Sound off'}
        className={cn(base, sound ? on : off)}
      >
        {sound ? (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
