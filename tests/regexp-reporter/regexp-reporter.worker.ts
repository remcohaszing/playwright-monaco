import { type worker } from 'monaco-editor'
// @ts-expect-error This is untyped.
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker.js'

interface RegExpReporterWorkerCreateData {
  /**
   * The regular expression to match.
   */
  regExp: RegExp
}

interface ValidationResult {
  /**
   * The validation message
   */
  message: string

  /**
   * The start offset of the validation result.
   */
  start: number

  /**
   * The end offset of the validation result.
   */
  end: number
}

/**
 * A worker that reports if a model value matches a regular expression.
 */
export class RegExpReporterWorker {
  #ctx: worker.IWorkerContext

  #createData: RegExpReporterWorkerCreateData

  constructor(ctx: worker.IWorkerContext, createData: RegExpReporterWorkerCreateData) {
    this.#ctx = ctx
    this.#createData = createData
  }

  // eslint-disable-next-line require-await
  async doValidate(uri: string): Promise<ValidationResult[]> {
    const model = this.#getModel(uri)
    const result: ValidationResult[] = []

    if (!model) {
      return result
    }

    const regExp = new RegExp(this.#createData.regExp, `${this.#createData.regExp.flags}g`)
    const value = model.getValue()

    for (const match of value.matchAll(regExp)) {
      if (match.index == null) {
        continue
      }

      result.push({
        start: match.index,
        end: match.index + match[0].length,
        message: `Invalid text ‘${match[0]}’`
      })
    }

    return result
  }

  #getModel(uri: string): worker.IMirrorModel | undefined {
    for (const model of this.#ctx.getMirrorModels()) {
      if (String(model.uri) === uri) {
        return model
      }
    }
  }
}

self.onmessage = () => {
  initialize(
    (ctx: worker.IWorkerContext, createData: RegExpReporterWorkerCreateData) =>
      new RegExpReporterWorker(ctx, createData)
  )
}
