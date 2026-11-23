import { Sprite } from 'pixi.js'
import { R } from '../core/Recursos.js'
import { sobrepoe } from './Fisica.js'
import { Sombra } from './Sombra.js'

export class Chefe {
  constructor(cena, x, y) {
    this.cena = cena
    this.x = x
    this.y = y
    this.vida = 100
    this.tempo = 0
    this.vulneravel = false
    this.relogioInvocar = 5
    this.recuo = 0
    this.derrotado = false
    this.sprite = new Sprite(R.coisa[0])
    this.sprite.anchor.set(0.5)
    this.sprite.scale.set(1.5)
    this.olhos = new Sprite(R.coisaOlhos[0])
    this.olhos.anchor.set(0.5)
    this.olhos.scale.set(1.5)
  }

  get centroX() {
    return this.x
  }

  get centroY() {
    return this.y
  }

  get caixa() {
    return { x: this.x - 22, y: this.y - 26, w: 44, h: 52 }
  }

  atualizar(dt) {
    if (this.derrotado) return
    const cena = this.cena
    const iris = cena.iris
    this.tempo += dt
    const lampadas = cena.lampadas.filter((l) => l.acesa).length
    const uv = cena.luzUV(this.x, this.y) || cena.luzUV(this.x - 14 * iris.direcao, this.y + 10)
    const branca = !uv && (cena.estaIluminado(this.x, this.y) || cena.estaIluminado(this.x - 14 * iris.direcao, this.y + 10))
    let velocidade = 34 + lampadas * 9
    if (branca) velocidade *= 0.55
    if (uv) {
      if (this.vulneravel) {
        velocidade *= 0.35
        this.vida -= 40 * dt
        if (Math.random() < dt * 30) cena.particulas.fumaca(this.x + (Math.random() - 0.5) * 30, this.y, 2)
        if (this.vida <= 0) {
          this.morrer()
          return
        }
      } else velocidade *= 0.4
    }
    if (this.recuo > 0) {
      this.recuo -= dt
      velocidade = -60
    }
    const dx = iris.centroX - this.x
    const dy = iris.centroY - 6 - this.y
    const d = Math.hypot(dx, dy) || 1
    this.x += (dx / d) * velocidade * dt
    this.y += (dy / d) * velocidade * dt
    this.relogioInvocar -= dt
    if (this.relogioInvocar <= 0 && !this.vulneravel) {
      this.relogioInvocar = 7 - lampadas
      const vivas = cena.sombras.filter((s) => !s.morta).length
      if (vivas < 3) {
        const sombra = new Sombra(cena, Math.round(this.x / 16) * 16, cena.chaoArena)
        sombra.invocada = true
        cena.sombras.push(sombra)
        cena.camadaEntidades.addChild(sombra.sprite)
        cena.acima.addChild(sombra.olhos)
        cena.som.sombraChiado()
      }
    }
    if (sobrepoe(this.caixa, iris) && iris.machucar(this.x)) this.recuo = 1.3
    const quadro = Math.floor(this.tempo * 8) % 4
    this.sprite.texture = R.coisa[quadro]
    this.olhos.texture = R.coisaOlhos[quadro]
    const tremor = uv ? (Math.random() - 0.5) * 4 : 0
    const escala = 1.5 + Math.sin(this.tempo * 4) * 0.06
    this.sprite.scale.set(escala)
    this.olhos.scale.set(escala)
    this.sprite.position.set(Math.round(this.x + tremor), Math.round(this.y))
    this.olhos.position.copyFrom(this.sprite.position)
    this.sprite.tint = this.vulneravel ? (Math.floor(this.tempo * 8) % 2 ? 0xffffff : 0xc080ff) : 0xffffff
  }

  morrer() {
    this.derrotado = true
    this.cena.particulas.fumaca(this.x, this.y, 80)
    this.cena.som.rugido()
    this.cena.som.sombraMorre()
    this.cena.tremer(8, 1.2)
    this.sprite.visible = false
    this.olhos.visible = false
    this.cena.chefeDerrotado()
  }
}
