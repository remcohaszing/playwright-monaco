import { type editor, type IDisposable } from 'monaco-editor'

import { type RegExpReporterWorker } from './regexp-reporter.worker.js'

/**
 * Report strings that match a regular expression.
 *
 * @param monaco The Monaco editor module.
 * @param regExp The regular expression to match.
 * @returns A disposable.
 */
export function createRegExpReporter(
  monaco: typeof import('monaco-editor'),
  regExp: RegExp
): IDisposable {
  const worker = monaco.editor.createWebWorker<RegExpReporterWorker>({
    moduleId: 'regexp-reporter',
    label: 'regexp-reporter',
    createData: { regExp }
  })

  const getMarkers = async (model: editor.ITextModel): Promise<void> => {
    const version = model.getVersionId()
    const client = await worker.withSyncedResources([model.uri])
    const reports = await client.doValidate(String(model.uri))

    if (version !== model.getVersionId()) {
      return
    }

    monaco.editor.setModelMarkers(
      model,
      'regexp-reporter',
      reports.map(({ end, message, start }) => ({
        ...monaco.Range.fromPositions(model.getPositionAt(start), model.getPositionAt(end)),
        message,
        severity: monaco.MarkerSeverity.Warning
      }))
    )
  }

  const listen = (model: editor.ITextModel): IDisposable => {
    getMarkers(model)

    return model.onDidChangeContent(() => {
      getMarkers(model)
    })
  }

  for (const model of monaco.editor.getModels()) {
    listen(model)
  }

  return monaco.editor.onDidCreateModel(listen)
}
