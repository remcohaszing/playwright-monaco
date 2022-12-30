import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('HTML intellisense', async ({ editor, page }) => {
  await editor.createModel('<!doctype html>\n<body>\n</body>\n', 'file:///file.html', true)
  await editor.setPosition({ lineNumber: 2, column: 5 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    'The body element represents the content of the document.MDN Reference'
  )
})

test('Handlebars intellisense', async ({ editor, page }) => {
  await editor.createModel('<!doctype html>\n<body>\n</body>\n', 'file:///file.hbs', true)
  await editor.setPosition({ lineNumber: 2, column: 5 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    'The body element represents the content of the document.MDN Reference'
  )
})

test('Razor intellisense', async ({ editor, page }) => {
  await editor.createModel('<!doctype html>\n<body>\n</body>\n', 'file:///file.cshtml', true)
  await editor.setPosition({ lineNumber: 2, column: 5 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    'The body element represents the content of the document.MDN Reference'
  )
})
