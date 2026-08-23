/**
 * The data layer's public surface.
 *
 * All page copy and structured data lives in this directory so components stay
 * presentational. It used to be one 400-line `content.ts`; splitting it by
 * concern means a change to the project list cannot cause a merge conflict in
 * the skills grid, and each module can carry the types that belong to it.
 *
 * Import from `@/data/content` — the modules behind it are an implementation
 * detail and may be split further.
 */

export * from './profile'
export * from './skills'
export * from './journey'
export * from './projects'
export * from './ai'
