import { Container, Graphics, Sprite } from 'pixi.js'
import { CORES } from '../config.js'
import { R, RETRATO, T } from '../core/Recursos.js'
import { quebrarLinhas, texto } from './Texto.js'

const LARGURA_TEXTO = 366

export class Dialogo {
  constructor(som) {
    this.som = som
    this.container = new Container()
    this.container.visible = false
    this.caixa = new Graphics()
    this.container.addChild(this.caixa)
    this.retrato = new Sprite(R.retratos[0])
    this.retrato.scale.set(2)
    this.retrato.position.set(16, 12)
    this.container.addChild(this.retrato)
    this.nome = texto('', { fill: CORES.destaque, fontSize: 16 })
    this.nome.position.set(96, 15)
    this.container.addChild(this.nome)
    this.corpo = texto('', { fontSize: 16 })
    this.corpo.position.set(96, 30)
    this.container.addChild(this.corpo)
    this.seta = texto('▼', { fill: CORES.destaque, fontSize: 14 })
    this.seta.position.set(456, 64)
    this.container.addChild(this.seta)
    this.falas = []
    this.ativo = false
    this.tempo = 0
  }

  desenharCaixa(papel) {
    this.caixa.clear()
    this.caixa.rect(8, 8, 464, 72).fill({ color: papel ? 0x1a140c : CORES.fundoCaixa, alpha: 0.94 })
    this.caixa.rect(8, 8, 464, 72).stroke({ color: papel ? 0x8a6a3a : CORES.bordaCaixa, width: 2 })
    this.caixa.rect(14, 12, 68, 64).fill({ color: 0x000000, alpha: 0.35 })
  }

  iniciar(falas, aoTerminar) {
    this.falas = falas.slice()
    this.aoTerminar = aoTerminar
    this.ativo = true
    this.container.visible = true
    this.proxima()
  }

  proxima() {
    const fala = this.falas.shift()
    if (!fala) {
      this.ativo = false
      this.container.visible = false
      const fim = this.aoTerminar
      this.aoTerminar = null
      if (fim) fim()
      return
    }
    this.fala = fala
    const papel = !fala.r
    this.desenharCaixa(papel)
    this.nome.text = fala.n || (papel ? 'Bilhete' : 'Iris')
    this.nome.style.fill = papel ? 0xe8c070 : CORES.destaque
    this.corpo.style.fill = papel ? CORES.papel : CORES.texto
    this.completo = quebrarLinhas(fala.t, { fontSize: 16 }, LARGURA_TEXTO)
    this.mostrados = 0
    this.corpo.text = ''
    this.tempoBoca = 0
    this.tempoPiscar = 2
    if (papel) {
      this.retrato.texture = R.tiles[T.BILHETE]
      this.retrato.scale.set(4)
      this.retrato.position.set(16, 12)
    } else {
      this.retrato.scale.set(2)
      this.retrato.position.set(16, 12)
      this.expressao = fala.r
      this.retrato.texture = R.retratos[RETRATO[fala.r]]
    }
  }

  atualizar(dt, entrada) {
    if (!this.ativo) return
    this.tempo += dt
    const digitando = this.mostrados < this.completo.length
    if (digitando) {
      const anterior = Math.floor(this.mostrados)
      this.mostrados = Math.min(this.completo.length, this.mostrados + dt * 45)
      if (Math.floor(this.mostrados) !== anterior && anterior % 2 === 0 && this.completo[anterior] !== ' ') this.som.letra()
      this.corpo.text = this.completo.slice(0, Math.floor(this.mostrados))
    }
    if (this.fala.r) {
      let quadro = RETRATO[this.expressao]
      if ((this.expressao === 'falando' || this.expressao === 'neutra') && digitando) {
        this.tempoBoca += dt
        quadro = Math.floor(this.tempoBoca * 8) % 2 === 0 ? RETRATO.falando : RETRATO.neutra
      } else if (this.expressao === 'falando') quadro = RETRATO.neutra
      if (quadro === RETRATO.neutra) {
        this.tempoPiscar -= dt
        if (this.tempoPiscar < 0) {
          quadro = RETRATO.olhos_fechados
          if (this.tempoPiscar < -0.12) this.tempoPiscar = 2 + Math.random() * 2
        }
      }
      if (this.expressao === 'assustada' || this.expressao === 'gritando') {
        this.retrato.x = 16 + Math.round((Math.random() - 0.5) * 2)
      }
      this.retrato.texture = R.retratos[quadro]
    }
    this.seta.visible = !digitando && Math.floor(this.tempo * 3) % 2 === 0
    if (entrada.apertou('confirmar')) {
      if (digitando) {
        this.mostrados = this.completo.length
        this.corpo.text = this.completo
      } else {
        this.som.menu()
        this.proxima()
      }
    }
  }
}
