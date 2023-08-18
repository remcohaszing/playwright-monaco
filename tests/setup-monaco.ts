import { createRegExpReporter } from './regexp-reporter/index.js'
import { monaco } from '../browser/exports.js'

createRegExpReporter(monaco, /beep/)
