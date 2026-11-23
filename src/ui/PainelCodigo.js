import { Container, Graphics } from 'pixi.js'
import { CORES } from '../config.js'
import { texto } from './Texto.js'

export class PainelCodigo {
  constructor(som, codigo, ordem) {
    this.som = som
    this.codigo = codigo
    this.container = new Container()
    this.container.visible = false
    const fundo = new Graphics()
    fundo.rect(0, 0, 480, 270).fill({ color: 0x000000, alpha: 0.6 })
    fundo.rect(130, 60, 220, 150).fill(0x14121c).stroke({ color: 0x5a5a6a, width: 2 })
    fundo.rect(150, 92, 180, 56).fill(0x0a1a10).stroke({ color: 0x1f5a34, width: 2 })
    this.container.addChild(fundo)
    const titulo = texto('CADEADO DE CÓDIGO', { fill: 0xc8c0d8, fontSize: 18 })
    titulo.anchor.set(0.5, 0)
    titulo.position.set(240, 70)
    this.container.addChild(titulo)
    this.digitos = []
    for (let i = 0; i < 4; i++) {
      const d = texto('0', { fill: 0x5aff8c, fontSize: 32 })
      d.anchor.set(0.5)
      d.position.set(180 + i * 40, 124)
      this.container.addChild(d)
      this.digitos.push(d)
    }
    if (ordem) {
      ordem.forEach((rotulo, i) => {
        const r = texto(rotulo, { fill: 0x2f8a50, fontSize: 14 })
        r.anchor.set(0.5, 1)
        r.position.set(180 + i * 40, 107)
        this.container.addChild(r)
      })
    }
    this.cursor = new Graphics()
    this.container.addChild(this.cursor)
    this.ajuda = texto('←/→ escolhe   ↑/↓ ou números muda\nENTER confirma   ESC sai', { fill: 0x8a82a0, fontSize: 14, align: 'center' })
    this.ajuda.anchor.set(0.5, 0)
    this.ajuda.position.set(240, 160)
    this.container.addChild(this.ajuda)
    this.mensagem = texto('', { fill: CORES.perigo, fontSize: 16 })
    this.mensagem.anchor.set(0.5, 0)
    this.mensagem.position.set(240, 190)
    this.container.addChild(this.mensagem)
  }

  abrir(aoAcertar, aoFechar) {
    this.valores = [0, 0, 0, 0]
    this.posicao = 0
    this.tremor = 0
    this.aoAcertar = aoAcertar
    this.aoFechar = aoFechar
    this.mensagem.text = ''
    this.container.visible = true
    this.tempo = 0
    this.redesenhar()
  }

  fechar() {
    this.container.visible = false
  }

  redesenhar() {
    this.digitos.forEach((d, i) => {
      d.text = String(this.valores[i])
    })
    this.cursor.clear()
    this.cursor.rect(166 + this.posicao * 40, 140, 28, 3).fill(0x5aff8c)
  }

  atualizar(dt, entrada) {
    this.tempo += dt
    if (this.tremor > 0) {
      this.tremor -= dt
      this.container.x = Math.round((Math.random() - 0.5) * 6 * (this.tremor > 0 ? 1 : 0))
    } else this.container.x = 0
    if (entrada.apertou('voltar')) {
      this.fechar()
      this.aoFechar()
      return
    }
    let mudou = false
    if (entrada.apertou('esquerda')) {
      this.posicao = (this.posicao + 3) % 4
      mudou = true
    }
    if (entrada.apertou('direita')) {
      this.posicao = (this.posicao + 1) % 4
      mudou = true
    }
    if (entrada.apertou('cima')) {
      this.valores[this.posicao] = (this.valores[this.posicao] + 1) % 10
      mudou = true
    }
    if (entrada.apertou('baixo')) {
      this.valores[this.posicao] = (this.valores[this.posicao] + 9) % 10
      mudou = true
    }
    for (let n = 0; n <= 9; n++) {
      if (entrada.apertouCodigo('Digit' + n) || entrada.apertouCodigo('Numpad' + n)) {
        this.valores[this.posicao] = n
        this.posicao = Math.min(3, this.posicao + 1)
        mudou = true
      }
    }
    if (mudou) {
      this.som.bip()
      this.mensagem.text = ''
      this.redesenhar()
    }
    if (entrada.apertouCodigo('Enter') || entrada.apertouCodigo('NumpadEnter')) {
      if (this.valores.join('') === this.codigo) {
        this.som.correto()
        this.fechar()
        this.aoAcertar()
      } else {
        this.som.errado()
        this.tremor = 0.3
        this.mensagem.text = 'Código errado.'
      }
    }
  }
}
