import { Sprite } from 'pixi.js'
import { R } from '../core/Recursos.js'
import { sobrepoe } from './Fisica.js'

export class Fantasma {
  constructor(cena, x, y) {
    this.cena = cena
    this.casaX = x + 8
    this.casaY = y + 6
    this.x = this.casaX
    this.y = this.casaY
    this.w = 10
    this.h = 14
    this.tempo = Math.random() * 10
    this.tempoUV = 0
    this.morta = false
    this.velocidade = 30
    this.sprite = new Sprite(R.fantasma[0])
    this.sprite.anchor.set(0.5)
    this.sprite.alpha = 0.6
    this.olhos = new Sprite(R.fantasmaOlhos[0])
    this.olhos.anchor.set(0.5)
  }

  get centroX() {
    return this.x
  }

  get centroY() {
    return this.y
  }

  get caixa() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }
  }

  atualizar(dt) {
    if (this.morta) return
    const cena = this.cena
    const iris = cena.iris
    this.tempo += dt
    const uv = cena.luzUV(this.x, this.y)
    const branca = !uv && cena.estaIluminado(this.x, this.y)
    let tremor = 0
    if (uv) {
      this.tempoUV += dt
      tremor = (Math.random() - 0.5) * 3
      if (Math.random() < dt * 25) cena.particulas.brilho(this.x, this.y, 2)
      if (this.tempoUV > 1) {
        this.morrer()
        return
      }
    } else {
      this.tempoUV = Math.max(0, this.tempoUV - dt * 0.5)
      const dx = iris.centroX - this.x
      const dy = iris.centroY - this.y
      const d = Math.hypot(dx, dy)
      if (d < 240 && d > 1) {
        const v = this.velocidade * (branca ? 1.25 : 1)
        this.x += (dx / d) * v * dt
        this.y += (dy / d) * v * dt
      } else {
        this.x += (this.casaX + Math.sin(this.tempo) * 12 - this.x) * dt
        this.y += (this.casaY + Math.sin(this.tempo * 1.7) * 6 - this.y) * dt
      }
    }
    if (sobrepoe(this.caixa, iris)) iris.machucar(this.x)
    const quadro = Math.floor(this.tempo * 6) % 4
    this.sprite.texture = R.fantasma[quadro]
    this.olhos.texture = R.fantasmaOlhos[quadro]
    const px = Math.round(this.x + tremor)
    const py = Math.round(this.y + Math.sin(this.tempo * 3) * 2)
    this.sprite.position.set(px, py)
    this.olhos.position.set(px, py)
    this.sprite.scale.x = iris.centroX < this.x ? -1 : 1
    this.olhos.scale.x = this.sprite.scale.x
    this.sprite.alpha = (branca ? 0.35 : 0.6) * (1 - this.tempoUV * 0.6) + Math.sin(this.tempo * 5) * 0.05
    this.olhos.alpha = 1 - this.tempoUV * 0.7
  }

  morrer() {
    this.morta = true
    this.sprite.visible = false
    this.olhos.visible = false
    this.cena.som.sombraMorre()
    this.cena.particulas.brilho(this.x, this.y, 20)
  }
}
