const MAPA = {
  esquerda: ['ArrowLeft', 'KeyA'],
  direita: ['ArrowRight', 'KeyD'],
  cima: ['ArrowUp', 'KeyW'],
  baixo: ['ArrowDown', 'KeyS'],
  pulo: ['Space', 'ArrowUp', 'KeyW'],
  interagir: ['KeyE', 'Enter'],
  lanterna: ['KeyF', 'KeyX'],
  pausa: ['Escape', 'KeyP'],
  confirmar: ['Enter', 'Space', 'KeyE'],
  voltar: ['Escape', 'Backspace'],
  mudo: ['KeyM']
}

const BLOQUEADAS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Backspace'])

export class Entrada {
  constructor() {
    this.seguradas = new Set()
    this.apertadas = new Set()
    this.digitado = ''
    this.ultimaTecla = null
    window.addEventListener('keydown', (e) => {
      if (BLOQUEADAS.has(e.code)) e.preventDefault()
      if (!e.repeat) {
        this.apertadas.add(e.code)
        this.ultimaTecla = e
        if (e.key.length === 1) this.digitado = (this.digitado + e.key.toLowerCase()).slice(-12)
      }
      this.seguradas.add(e.code)
    })
    window.addEventListener('keyup', (e) => this.seguradas.delete(e.code))
    window.addEventListener('blur', () => this.seguradas.clear())
  }

  segurando(acao) {
    return MAPA[acao].some((c) => this.seguradas.has(c))
  }

  apertou(acao) {
    return MAPA[acao].some((c) => this.apertadas.has(c))
  }

  apertouCodigo(codigo) {
    return this.apertadas.has(codigo)
  }

  algumaTecla() {
    return this.apertadas.size > 0
  }

  digitou(palavra) {
    if (this.digitado.endsWith(palavra)) {
      this.digitado = ''
      return true
    }
    return false
  }

  limpar() {
    this.apertadas.clear()
    this.ultimaTecla = null
  }
}
