import { fileURLToPath } from 'node:url'

import { serve } from 'esbuild'
import metadata from 'monaco-editor/esm/metadata.js'

const servedir = fileURLToPath(new URL('../www', import.meta.url))
const monacoEntryPoint = fileURLToPath(new URL('../browser/setup', import.meta.url))

interface EntryPointRecord extends Record<string, string> {
  /**
   * The setup entry point.
   */
  setup: string
}

interface ServerOptions {
  /**
   * If specified, use this port. By default a free port will be used.
   */
  port?: number
}

/**
 * Create an esbuild dev server for use with Playwright.
 *
 * @param entryPoints The path to the entry point(s) to load. If a string is provided, it’s loaded
 * as `/setup.js` If an object is provided, each key is loaded and the `setup` key is required.
 * @param options Optional options.
 * @returns A web server that serves a Monaco editor instance.
 */
export async function createServer(
  entryPoints: EntryPointRecord | string,
  options: ServerOptions = {}
): Promise<string> {
  const allEntryPoints: Record<string, string> = Object.create(null)

  for (const language of metadata.languages) {
    if (language.worker) {
      allEntryPoints[language.label] = `monaco-editor/esm/${language.worker.entry}`
    }
  }

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

  const result = await serve(
    { port: options.port, servedir, host: '127.0.0.1' },
    {
      bundle: true,
      conditions: ['worker'],
      entryPoints: allEntryPoints,
      format: 'iife',
      loader: {
        '.ttf': 'file'
      }
    }
  )

  return `http://${result.host}:${result.port}`
}
