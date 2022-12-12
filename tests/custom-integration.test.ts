import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('Custom worker based integration', async ({ editor, page }) => {
  await page.pause()
  const markers = await editor.waitForMarkers('file:///file.txt', async () => {
    await editor.createModel('beep boop\nboop beep\n', 'file:///file.txt', true)
  })
  expect(markers).toStrictEqual([
    {
      endColumn: 5,
      endLineNumber: 1,
      message: 'Invalid text ‘beep’',
      owner: 'regexp-reporter',
      resource: 'file:///file.txt',
      severity: 4,
      source: undefined,
      startColumn: 1,
      startLineNumber: 1,
      tags: undefined
    },
    {
      endColumn: 10,
      endLineNumber: 2,
      message: 'Invalid text ‘beep’',
      owner: 'regexp-reporter',
      resource: 'file:///file.txt',
      severity: 4,
      source: undefined,
      startColumn: 6,
      startLineNumber: 2,
      tags: undefined
    }
  ])
})
