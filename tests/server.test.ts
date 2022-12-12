import { expect, test } from '@playwright/test'
import { createServer } from 'playwright-monaco'

test('createServer', async () => {
  await expect(() =>
    // @ts-expect-error This tests invalid input.
    createServer({})
  ).rejects.toThrowError(new Error('Missing setup entry point'))
})
