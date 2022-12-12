import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('JavaScript intellisense', async ({ editor, page }) => {
  await editor.createModel('export const foo = "I am a string"\n', 'file:///file.js', true)
  await editor.setPosition({ lineNumber: 1, column: 16 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText('const foo: "I am a string"')
})

test('TypeScript intellisense', async ({ editor, page }) => {
  await editor.createModel('export const foo = "I am a string"\n', 'file:///file.ts', true)
  await editor.setPosition({ lineNumber: 1, column: 16 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText('const foo: "I am a string"')
})
