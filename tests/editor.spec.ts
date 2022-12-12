import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('createModel', async ({ editor }) => {
  await editor.createModel('a', '/a.txt', undefined, 'javascript')
  await editor.createModel('b', 'file:///b.txt', true)
  await editor.createModel('c', new URL('file:///c.txt'))

  const result = await editor.evaluate(({ ed, monaco }) => ({
    active: String(ed.getModel()?.uri),
    models: monaco.editor.getModels().map((model) => ({
      languageId: model.getLanguageId(),
      uri: String(model.uri),
      value: model.getValue()
    }))
  }))

  expect(result).toStrictEqual({
    active: 'file:///b.txt',
    models: [
      {
        languageId: 'javascript',
        uri: 'file:///a.txt',
        value: 'a'
      },
      {
        languageId: 'plaintext',
        uri: 'file:///b.txt',
        value: 'b'
      },
      {
        languageId: 'plaintext',
        uri: 'file:///c.txt',
        value: 'c'
      }
    ]
  })
})

test.describe('open', () => {
  test('No options', async ({ editor }) => {
    await editor.open('tests/fixtures/*.txt')

    const result = await editor.evaluate(({ monaco }) =>
      monaco.editor.getModels().map((model) => ({
        languageId: model.getLanguageId(),
        uri: String(model.uri),
        value: model.getValue()
      }))
    )

    expect(result).toStrictEqual([
      {
        languageId: 'plaintext',
        uri: 'inmemory://model/1',
        value: ''
      },
      {
        languageId: 'plaintext',
        uri: 'file:///tests/fixtures/a.txt',
        value: 'Content of a.txt\n'
      },
      {
        languageId: 'plaintext',
        uri: 'file:///tests/fixtures/b.txt',
        value: 'Content of b.txt\n'
      }
    ])
  })

  test('string cwd', async ({ editor }) => {
    await editor.open('fixtures/*.txt', { cwd: 'tests' })

    const result = await editor.evaluate(({ monaco }) =>
      monaco.editor.getModels().map((model) => ({
        languageId: model.getLanguageId(),
        uri: String(model.uri),
        value: model.getValue()
      }))
    )

    expect(result).toStrictEqual([
      {
        languageId: 'plaintext',
        uri: 'inmemory://model/1',
        value: ''
      },
      {
        languageId: 'plaintext',
        uri: 'file:///fixtures/a.txt',
        value: 'Content of a.txt\n'
      },
      {
        languageId: 'plaintext',
        uri: 'file:///fixtures/b.txt',
        value: 'Content of b.txt\n'
      }
    ])
  })

  test('URL cwd', async ({ editor }) => {
    await editor.open('*.txt', { cwd: new URL('fixtures', import.meta.url) })

    const result = await editor.evaluate(({ monaco }) =>
      monaco.editor.getModels().map((model) => ({
        languageId: model.getLanguageId(),
        uri: String(model.uri),
        value: model.getValue()
      }))
    )

    expect(result).toStrictEqual([
      {
        languageId: 'plaintext',
        uri: 'inmemory://model/1',
        value: ''
      },
      {
        languageId: 'plaintext',
        uri: 'file:///a.txt',
        value: 'Content of a.txt\n'
      },
      {
        languageId: 'plaintext',
        uri: 'file:///b.txt',
        value: 'Content of b.txt\n'
      }
    ])
  })
})

test('setModel', async ({ editor }) => {
  await editor.evaluate(({ monaco }) => {
    monaco.editor.createModel('', undefined, monaco.Uri.parse('a://b'))
  })

  await editor.setModel('a://b')

  const content = await editor.evaluate(({ ed }) => String(ed.getModel()?.uri))
  expect(content).toBe('a://b')
})

test('setPosition', async ({ editor }) => {
  await editor.evaluate(({ ed }) => {
    ed.setValue('Line 1\nLine2\nLine3\n')
  })

  await editor.setPosition({ lineNumber: 2, column: 3 })

  const content = await editor.evaluate(({ ed }) => ed.getPosition())
  expect(content).toStrictEqual({ lineNumber: 2, column: 3 })
})

test('trigger', async ({ editor }) => {
  await editor.evaluate(({ ed }) => {
    ed.setValue('')
  })

  await editor.trigger('editor.action.indentLines')

  const content = await editor.evaluate(({ ed }) => ed.getValue())

  expect(content).toStrictEqual('    ')
})
