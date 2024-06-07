import * as monaco from 'monaco-editor'

const workerAliases: Record<string, string> = {
  scss: 'css',
  less: 'css',
  handlebars: 'html',
  razor: 'html',
  javascript: 'typescript'
}

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    const name = label in workerAliases ? workerAliases[label] : label
    return new Worker(`/${name}.js`)
  }
}

const element = document.getElementById('editor')!
const ed = monaco.editor.create(element, {
  automaticLayout: true,
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs-light'
})

Object.assign(window, { ed, monaco })

ed.focus()
