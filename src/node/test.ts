import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { test as base, type JSHandle } from '@playwright/test'
import { globby, type Options as GlobbyOptions } from 'globby'
import { type editor, type IPosition } from 'monaco-editor'

import { type MonacoGlobals } from '../shared/types.js'

interface SerializedRelatedInformation extends Omit<editor.IRelatedInformation, 'resource'> {
  resource: string
}

interface SerializedMarker
  extends Omit<editor.IMarker, 'code' | 'relatedInformation' | 'resource'> {
  code?: string | { value: string; target: string }
  relatedInformation?: SerializedRelatedInformation[]
  resource: string
}

interface MonacoEditorHelpers {
  /**
   * Create a Monaco editor model.
   *
   * @param value
   *   The value to set.
   * @param pathOrUri
   *   The path or uri of the model. If a path is given, it will be converted to a file uri.
   * @param open
   *   If set to true, the created model is opened in the editor.
   * @param language
   *   The model language. By default this is auto detected based on the uri.
   * @returns
   *   A Playwright handle for the model.
   */
  createModel: (
    value: string,
    pathOrUri?: URL | string,
    open?: boolean,
    language?: string
  ) => Promise<JSHandle<editor.ITextModel>>

  /**
   * Open a files from the file system in Monaco editor.
   *
   * @param patterns
   *   A glob pattern or array of glob patterns to open in the editor.
   * @param options
   *   Options to pass to globby. The `cwd` option is also used to determine the base path of the
   *   file.
   */
  open: (
    patterns: string[] | string,
    options?: Omit<
      GlobbyOptions,
      'absolute' | 'markDirectories' | 'objectMode' | 'onlyFiles' | 'unique'
    >
  ) => Promise<void>

  /**
   * Open an existing model in the editor.
   *
   * @param uri
   *   The uri of the model to open.
   */
  setModel: (uri: string) => Promise<void>

  /**
   * Set the position in the editor.
   *
   * @param position
   *   The position to set.
   */
  setPosition: (position: IPosition) => Promise<void>

  /**
   * Trigger an editor action.
   *
   * @param handlerId
   *   The id of the action to trigger.
   * @param payload
   *   An additional payload to send with the action.
   * @returns
   *   The result of the action.
   */
  trigger: (handlerId: string, payload?: unknown) => Promise<unknown>

  /**
   * Wait for marker data to be triggered for a resource.
   *
   * @param uri
   *   The resource uri to wait for markers for.
   * @param fn
   *   A function to evaluate to trigger marker data.
   * @returns
   *   Marker data for the uri.
   */
  waitForMarkers: (uri: string, fn: () => Promise<void>) => Promise<SerializedMarker[]>
}

export type EditorHandle = JSHandle<MonacoGlobals> & MonacoEditorHelpers

export interface PlaywrightMonacoFixtures {
  editor: EditorHandle
}

/**
 * A Playwright test environment that’s configured with Monaco editor helpers.
 */
export const test = base.extend<PlaywrightMonacoFixtures>({
  async editor({ page }, use) {
    await page.goto('/')

    const handle = await page.evaluateHandle(() => window as MonacoGlobals)
    const helpers: MonacoEditorHelpers = {
      createModel(value, pathOrUri, open, language) {
        let path: string | undefined

        if (pathOrUri) {
          if (pathOrUri instanceof URL) {
            path = String(pathOrUri)
          } else {
            try {
              // TODO [engine:node@>=24]: Use URL.canParse()
              // eslint-disable-next-line no-new
              new URL(pathOrUri)
            } catch {
              path = `file://${pathOrUri}`
            }
            if (!path) {
              path = pathOrUri
            }
          }
        }

        return handle.evaluateHandle(
          ({ ed, monaco }, [val, p, lang, doOpen]) => {
            /* c8 ignore start */
            const model = monaco.editor.createModel(val, lang, p ? monaco.Uri.parse(p) : undefined)
            if (doOpen) {
              ed.setModel(model)
            }
            return model
          },

          /* c8 ignore stop */
          [value, path, language, open] as const
        )
      },

      async open(patterns, options = {}) {
        const paths = await globby(patterns, {
          ...options,
          absolute: false,
          objectMode: false,
          onlyFiles: true,
          unique: true
        })
        const { cwd } = options
        const basedir = cwd ? (typeof cwd === 'string' ? cwd : fileURLToPath(cwd)) : process.cwd()
        const values = await Promise.all(
          paths.map(async (path) => {
            const absolutePath = join(basedir, path)
            return [path.replaceAll('\\', '/'), await readFile(absolutePath, 'utf8')] as const
          })
        )

        return handle.evaluate(({ monaco }, entries) => {
          /* c8 ignore start */
          const root = monaco.Uri.parse('file:///')
          for (const [path, value] of entries) {
            monaco.editor.createModel(value, undefined, monaco.Uri.joinPath(root, path))
          }

          /* c8 ignore stop */
        }, values)
      },

      setModel: (uri) =>
        handle.evaluate(({ ed, monaco }, uriString) => {
          /* c8 ignore next */
          ed.setModel(monaco.editor.getModel(monaco.Uri.parse(uriString)))
        }, uri),

      setPosition: (position) =>
        handle.evaluate(({ ed }, pos) => {
          /* c8 ignore next */
          ed.setPosition(pos, 'monaco-playwright')
        }, position),

      trigger: (...args) =>
        handle.evaluate(({ ed }, [handlerId, payload]) => {
          /* c8 ignore next */
          ed.trigger('monaco-playwright', handlerId, payload)
        }, args),

      async waitForMarkers(uri, fn) {
        const markerPromise = handle.evaluate(({ monaco }, uriString) => {
          /* c8 ignore start */
          const serializeMarker = ({
            code,
            relatedInformation,
            resource,
            ...marker
          }: editor.IMarker): SerializedMarker => {
            const serializedMarker: SerializedMarker = {
              ...marker,
              resource: String(resource)
            }

            if (code != null) {
              serializedMarker.code =
                typeof code === 'string' ? code : { ...code, target: String(code) }
            }

            if (relatedInformation != null) {
              serializedMarker.relatedInformation = relatedInformation.map((info) => ({
                ...info,
                resource: String(info.resource)
              }))
            }

            return serializedMarker
          }

          return new Promise<SerializedMarker[]>((resolve) => {
            const disposable = monaco.editor.onDidChangeMarkers((resources) => {
              for (const resource of resources) {
                if (String(resource) === uriString) {
                  disposable.dispose()
                  const markers = monaco.editor.getModelMarkers({ resource })
                  resolve(markers.map(serializeMarker))
                }
              }
            })
          })

          /* c8 ignore stop */
        }, uri)
        await fn()
        return markerPromise
      }
    }

    await use(Object.assign(handle, helpers))
    await handle.dispose()
  }
})
