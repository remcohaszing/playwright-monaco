import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('CSS intellisense', async ({ editor, page }) => {
  await editor.createModel('body { color: red; }\n', 'file:///file.css', true)
  await editor.setPosition({ lineNumber: 1, column: 16 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    "Sets the color of an element's textSyntax: <color>MDN Reference"
  )
})

test('LESS intellisense', async ({ editor, page }) => {
  await editor.createModel('body { color: red; }\n', 'file:///file.less', true)
  await editor.setPosition({ lineNumber: 1, column: 16 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    "Sets the color of an element's textSyntax: <color>MDN Reference"
  )
})

test('SCSS intellisense', async ({ editor, page }) => {
  await editor.createModel('body { color: red; }\n', 'file:///file.scss', true)
  await editor.setPosition({ lineNumber: 1, column: 16 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText(
    "Sets the color of an element's textSyntax: <color>MDN Reference"
  )
})
