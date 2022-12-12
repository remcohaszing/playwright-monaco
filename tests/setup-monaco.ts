import { monaco } from '../browser/exports.js'
import { createRegExpReporter } from './regexp-reporter/index.js'

createRegExpReporter(monaco, /beep/)
