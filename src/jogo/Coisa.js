import { Sprite } from 'pixi.js'
import { R } from '../core/Recursos.js'

export class Coisa {
  constructor(cena, x, y) {
    this.cena = cena
    this.x = x
    this.y = y
    this.w = 30
    this.h = 40
    this.velocidade = 60
    this.tempo = 0
    this.ativa = true
    this.sprite = new Sprite(R.coisa[0])
    this.sprite.anchor.set(0.5, 0.5)
    this.olhos = new Sprite(R.coisaOlhos[0])
    this.olhos.anchor.set(0.5, 0.5)
  }

  get centroX() {
    return this.x + this.w / 2
  }

  get centroY() {
    return this.y + this.h / 2
  }

  atualizar(dt) {
    if (!this.ativa) return
    const iris = this.cena.iris
    this.tempo += dt
    const iluminada = this.cena.estaIluminado(this.centroX + 8, this.centroY) || this.cena.estaIluminado(this.centroX, this.centroY - 10)
    const distancia = iris.centroX - this.centroX
    const base = Math.min(88, this.velocidade + this.tempo * 2.2)
    let velocidade = iluminada ? base * 0.45 : base
    if (distancia > 200) velocidade = 120
    this.x += velocidade * dt
    const alvoY = iris.centroY - this.h / 2 - 4
    this.y += (alvoY - this.y) * Math.min(1, dt * 2)
    if (iluminada && Math.random() < dt * 25) this.cena.particulas.fumaca(this.centroX + 10, this.centroY, 1)
    if (Math.random() < dt * 12) this.cena.particulas.fumaca(this.x + Math.random() * this.w, this.y + this.h, 1)

    const alcance = this.x + this.w - 4
    if (iris.x < alcance && iris.x + iris.w > this.x + 6 && Math.abs(iris.centroY - this.centroY) < 34) {
      this.cena.pegoPelaCoisa()
    }

    const quadro = Math.floor(this.tempo * 7) % 4
    this.sprite.texture = R.coisa[quadro]
    this.olhos.texture = R.coisaOlhos[quadro]
    const tremor = iluminada ? (Math.random() - 0.5) * 3 : 0
    const escala = 1 + Math.sin(this.tempo * 3) * 0.05
    this.sprite.scale.set(escala)
    this.olhos.scale.set(escala)
    this.sprite.position.set(Math.round(this.centroX + tremor), Math.round(this.centroY))
    this.olhos.position.copyFrom(this.sprite.position)
  }

  destruir() {
    this.ativa = false
    this.sprite.destroy()
    this.olhos.destroy()
  }
}
