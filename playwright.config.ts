import { type PlaywrightTestConfig } from '@playwright/test'

import { createServer } from './node/index.js'

const config: PlaywrightTestConfig = {
  use: {
    baseURL: await createServer({
      setup: './tests/setup-monaco',
      'regexp-reporter': './tests/regexp-reporter/regexp-reporter.worker'
    }),
    colorScheme: 'dark'
  }
}

export default config
