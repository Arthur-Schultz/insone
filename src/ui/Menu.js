import { Container } from 'pixi.js'
import { CORES } from '../config.js'
import { texto } from './Texto.js'

export class Menu {
  constructor(som, opcoes, { x = 240, y = 150, espaco = 18, tamanho = 18, centralizado = true } = {}) {
    this.som = som
    this.container = new Container()
    this.selecionado = 0
    this.opcoes = opcoes
    this.textos = opcoes.map((o, i) => {
      const t = texto(o.rotulo, { fontSize: tamanho })
      if (centralizado) t.anchor.set(0.5, 0)
      t.position.set(x, y + i * espaco)
      this.container.addChild(t)
      return t
    })
    this.tempo = 0
    this.atualizarVisual()
  }

  atualizarVisual() {
    this.textos.forEach((t, i) => {
      const sel = i === this.selecionado
      t.text = sel ? `> ${this.opcoes[i].rotulo} <` : this.opcoes[i].rotulo
      t.style.fill = sel ? CORES.destaque : 0x8a82a0
    })
  }

  atualizar(dt, entrada) {
    this.tempo += dt
    if (entrada.apertou('cima') || entrada.apertouCodigo('ArrowUp')) {
      this.selecionado = (this.selecionado + this.opcoes.length - 1) % this.opcoes.length
      this.som.menu()
      this.atualizarVisual()
    }
    if (entrada.apertou('baixo')) {
      this.selecionado = (this.selecionado + 1) % this.opcoes.length
      this.som.menu()
      this.atualizarVisual()
    }
    if (entrada.apertou('confirmar')) {
      this.som.confirmarMenu()
      this.opcoes[this.selecionado].acao()
    }
  }
}
