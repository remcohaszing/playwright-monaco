import { monaco } from 'playwright-monaco'

import { createRegExpReporter } from './regexp-reporter/index.js'

createRegExpReporter(monaco, /beep/)
