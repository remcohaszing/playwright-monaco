import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('JSON intellisense', async ({ editor, page }) => {
  await editor.evaluate(({ monaco }) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        {
          fileMatch: ['person.json'],
          uri: 'https://example.com/person.schema.json',
          schema: {
            type: 'object',
            properties: { givenName: { type: 'string', description: 'The person’s given name' } }
          }
        }
      ]
    })
  })
  await editor.createModel('{"givenName": ""}', 'file:///person.json', true)
  await editor.setPosition({ lineNumber: 1, column: 8 })
  await editor.trigger('editor.action.showHover')
  await expect(page.locator('.hover-contents')).toHaveText('The person’s given name')
})
