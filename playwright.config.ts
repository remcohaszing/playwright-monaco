import { type PlaywrightTestConfig } from '@playwright/test'
import { createServer } from 'playwright-monaco'

const config: PlaywrightTestConfig = {
  expect: { timeout: 10_000 },
  timeout: 60_000,
  use: {
    baseURL: await createServer({
      setup: './tests/setup-monaco',
      'regexp-reporter': './tests/regexp-reporter/regexp-reporter.worker'
    }),
    colorScheme: 'dark'
  }
}

export default config
