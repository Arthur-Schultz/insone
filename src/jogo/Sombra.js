import { Sprite } from 'pixi.js'
import { FISICA } from '../config.js'
import { R } from '../core/Recursos.js'
import { mover, sobrepoe } from './Fisica.js'

export class Sombra {
  constructor(cena, x, y) {
    this.cena = cena
    this.w = 12
    this.h = 14
    this.inicioX = x + 2
    this.inicioY = y + 16 - this.h
    this.x = this.inicioX
    this.y = this.inicioY
    this.vx = 0
    this.vy = 0
    this.velocidade = 52 + Math.random() * 10
    this.tempoLuz = 0
    this.morta = false
    this.tempo = Math.random() * 10
    this.relogioPiscar = 2 + Math.random() * 3
    this.relogioChiado = 0
    this.sprite = new Sprite(R.sombra[0])
    this.sprite.anchor.set(0.5, 1)
    this.olhos = new Sprite(R.sombraOlhos[0])
    this.olhos.anchor.set(0.5, 1)
  }

  get centroX() {
    return this.x + this.w / 2
  }

  get centroY() {
    return this.y + this.h / 2
  }

  atualizar(dt) {
    if (this.morta) return
    const cena = this.cena
    const iris = cena.iris
    this.tempo += dt
    const iluminada = cena.estaIluminado(this.centroX, this.centroY)
    let tremor = 0

    if (iluminada) {
      this.tempoLuz += dt
      this.vx = 0
      tremor = (Math.random() - 0.5) * 2 * Math.min(2, 1 + this.tempoLuz * 2)
      this.relogioChiado -= dt
      if (this.relogioChiado <= 0) {
        this.relogioChiado = 0.35
        cena.som.sombraChiado()
      }
      if (Math.random() < dt * 20) cena.particulas.fumaca(this.centroX, this.centroY, 1)
      if (this.tempoLuz > 1.25) {
        this.morrer()
        return
      }
    } else {
      this.tempoLuz = Math.max(0, this.tempoLuz - dt * 0.4)
      const dx = iris.centroX - this.centroX
      const dy = iris.centroY - this.centroY
      const perto = Math.abs(dx) < 200 && Math.abs(dy) < 56
      let alvo = 0
      if (perto) alvo = Math.sign(dx) * this.velocidade
      else alvo = Math.sin(this.tempo * 0.8) * 10
      const frente = this.x + (alvo > 0 ? this.w + 2 : -2)
      if (alvo !== 0 && !cena.fase.chaoEm(frente, this.y + this.h + 2)) alvo = 0
      this.vx = alvo
    }

    this.vy = Math.min(FISICA.quedaMaxima, this.vy + FISICA.gravidade * dt)
    const r = mover(this, this.vx * dt, this.vy * dt, cena.fase, cena.solidos())
    if (r.y) this.vy = 0

    if (sobrepoe(this, iris)) iris.machucar(this.centroX)

    this.relogioPiscar -= dt
    let piscando = false
    if (this.relogioPiscar < 0) {
      piscando = true
      if (this.relogioPiscar < -0.15) this.relogioPiscar = 2 + Math.random() * 4
    }
    const quadro = Math.floor(this.tempo * 6) % 4
    this.sprite.texture = R.sombra[quadro]
    this.olhos.texture = R.sombraOlhos[piscando || iluminada ? 1 : 0]
    const px = Math.round(this.centroX + tremor)
    const py = Math.round(this.y + this.h + 1)
    this.sprite.position.set(px, py)
    this.olhos.position.set(px, py)
    if (this.vx !== 0) {
      this.sprite.scale.x = Math.sign(this.vx)
      this.olhos.scale.x = Math.sign(this.vx)
    }
    this.sprite.alpha = 1 - Math.min(0.6, this.tempoLuz * 0.5)
    this.olhos.alpha = this.sprite.alpha
  }

  morrer() {
    this.morta = true
    this.sprite.visible = false
    this.olhos.visible = false
    this.cena.som.sombraMorre()
    this.cena.particulas.fumaca(this.centroX, this.centroY, 26)
  }
}
