import { type editor } from 'monaco-editor'

export type MonacoGlobals = Window &
  typeof globalThis & {
    /**
     * The Monaco editor instance on the page.
     */
    ed: editor.IStandaloneCodeEditor

    /**
     * The Monaco editor module.
     */
    monaco: typeof import('monaco-editor')
  }
