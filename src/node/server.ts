import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { context } from 'esbuild'
import findCacheDir from 'find-cache-dir'
import metadata from 'monaco-editor/esm/metadata.js'

const outdir = findCacheDir({ name: 'playwright-monaco' })
const iconEntryPoint = fileURLToPath(new URL('../../www/icon.svg', import.meta.url))
const indexEntryPoint = fileURLToPath(new URL('../../www/index.html', import.meta.url))
const monacoEntryPoint = fileURLToPath(new URL('../browser/setup.js', import.meta.url))

interface EntryPointRecord extends Record<string, string> {
  /**
   * The setup entry point.
   */
  setup: string
}

export interface CreateServerOptions {
  /**
   * Substitute packages with an alternative.
   *
   * @see https://esbuild.github.io/api/#alias
   */
  alias?: Record<string, string>

  /**
   * If specified, use this port. By default a free port will be used.
   */
  port?: number
}

/**
 * Create an esbuild dev server for use with Playwright.
 *
 * @param entryPoints
 *   The path to the entry point(s) to load. If a string is provided, it’s loaded  as `/setup.js`.
 *   If an object is provided, each key is loaded and the `setup` key is required.
 * @param options
 *   Optional options.
 * @returns
 *   A web server that serves a Monaco editor instance.
 */
export async function createServer(
  entryPoints: EntryPointRecord | string,
  options: CreateServerOptions = {}
): Promise<string> {
  /* c8 ignore start */
  if (!outdir) {
    throw new Error('Could not find cache directory')
  }

  /* c8 ignore end */

  const allEntryPoints: Record<string, string> = Object.create(null)

  for (const language of metadata.languages) {
    if (language.worker) {
      allEntryPoints[language.label] = `monaco-editor/esm/${language.worker.entry}`
    }
  }

  allEntryPoints.icon = iconEntryPoint
  allEntryPoints.index = indexEntryPoint
  allEntryPoints['monaco-editor'] = monacoEntryPoint
  allEntryPoints.editorWorkerService = 'monaco-editor/esm/vs/editor/editor.worker.js'

  /* c8 ignore start */
  if (typeof entryPoints === 'string') {
    allEntryPoints.setup = entryPoints

    /* c8 ignore end */
  } else if (typeof entryPoints === 'object') {
    Object.assign(allEntryPoints, entryPoints)
  }

  if (!allEntryPoints.setup) {
    throw new Error('Missing setup entry point')
  }

  await rm(outdir, { force: true, recursive: true })
  const ctx = await context({
    alias: options.alias,
    bundle: true,
    conditions: ['worker'],
    outdir,
    entryPoints: allEntryPoints,
    format: 'iife',
    loader: {
      '.html': 'copy',
      '.svg': 'copy',
      '.ttf': 'file'
    }
  })

  const result = await ctx.serve({ port: options.port, servedir: outdir, host: '127.0.0.1' })

  return `http://${result.host}:${result.port}`
}
