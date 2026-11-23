import { Container, Graphics, Sprite } from 'pixi.js'
import { CORES } from '../config.js'
import { R, T } from '../core/Recursos.js'
import { texto } from './Texto.js'

export class Hud {
  constructor(nomeFase) {
    this.container = new Container()
    this.coracoes = []
    for (let i = 0; i < 3; i++) {
      const c = new Sprite(R.tiles[T.CORACAO])
      c.position.set(4 + i * 15, 2)
      this.container.addChild(c)
      this.coracoes.push(c)
    }
    this.bateria = new Graphics()
    this.container.addChild(this.bateria)
    this.chave = new Sprite(R.tiles[T.CHAVE])
    this.chave.position.set(112, 2)
    this.container.addChild(this.chave)
    this.rotuloLanterna = texto('F', { fill: 0x8a82a0, fontSize: 14 })
    this.rotuloLanterna.position.set(52, 4)
    this.container.addChild(this.rotuloLanterna)
    this.nome = texto(nomeFase, { fill: 0x6a6280, fontSize: 14 })
    this.nome.anchor.set(1, 0)
    this.nome.position.set(474, 4)
    this.container.addChild(this.nome)
    this.aviso = texto('', { fill: CORES.texto, fontSize: 16, stroke: { color: 0x000000, width: 3 } })
    this.aviso.anchor.set(0.5, 0)
    this.aviso.position.set(240, 236)
    this.container.addChild(this.aviso)
    this.tempoAviso = 0
    this.tempo = 0
  }

  mostrarAviso(mensagem) {
    this.aviso.text = mensagem
    this.tempoAviso = 2.8
  }

  atualizar(dt, iris, estado) {
    this.tempo += dt
    this.coracoes.forEach((c, i) => {
      const cheio = i < iris.sanidade
      c.tint = cheio ? 0xffffff : 0x2a2030
      c.alpha = cheio ? 1 : 0.8
      const pulsa = cheio && iris.sanidade === 1
      c.scale.set(pulsa ? 1 + Math.max(0, Math.sin(this.tempo * 8)) * 0.12 : 1)
    })
    const b = this.bateria
    b.clear()
    b.rect(62, 6, 42, 9).fill(0x0a0810).stroke({ color: 0x6a6280, width: 1 })
    b.rect(104, 8, 2, 5).fill(0x6a6280)
    const nivel = iris.bateria / 100
    const cor = nivel > 0.5 ? 0x5aff8c : nivel > 0.2 ? 0xffd060 : 0xff3c50
    const piscaFraca = nivel <= 0.2 && Math.floor(this.tempo * 4) % 2 === 0
    if (nivel > 0 && !piscaFraca) b.rect(64, 8, Math.max(1, Math.round(38 * nivel)), 5).fill(cor)
    if (!iris.lanternaLigada) b.rect(62, 6, 42, 9).fill({ color: 0x000000, alpha: 0.55 })
    this.chave.visible = !!estado.temChave
    if (this.tempoAviso > 0) {
      this.tempoAviso -= dt
      this.aviso.alpha = Math.min(1, this.tempoAviso * 2)
    } else this.aviso.alpha = 0
  }
}
