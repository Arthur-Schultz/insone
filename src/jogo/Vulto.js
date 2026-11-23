import { Sprite } from 'pixi.js'
import { R } from '../core/Recursos.js'
import { sobrepoe } from './Fisica.js'

export class Vulto {
  constructor(cena, x, y) {
    this.cena = cena
    this.casaX = x + 8
    this.casaY = y + 8
    this.x = this.casaX
    this.y = this.casaY
    this.w = 12
    this.h = 8
    this.estado = 'pairando'
    this.tempo = Math.random() * 10
    this.espera = 1 + Math.random()
    this.tempoEstado = 0
    this.relogioAsa = 0
    this.sprite = new Sprite(R.vulto[0])
    this.sprite.anchor.set(0.5)
    this.olhos = new Sprite(R.vultoOlhos[0])
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

  irPara(alvoX, alvoY, velocidade, dt) {
    const dx = alvoX - this.x
    const dy = alvoY - this.y
    const d = Math.hypot(dx, dy)
    if (d < 1) return true
    const passo = Math.min(d, velocidade * dt)
    this.x += (dx / d) * passo
    this.y += (dy / d) * passo
    return d < 4
  }

  mudar(estado) {
    this.estado = estado
    this.tempoEstado = 0
  }

  atualizar(dt) {
    const cena = this.cena
    const iris = cena.iris
    this.tempo += dt
    this.tempoEstado += dt
    const iluminado = cena.estaIluminado(this.x, this.y)

    if (iluminado && this.estado !== 'fugindo') {
      this.mudar('fugindo')
      this.fugaX = Math.sign(this.x - iris.centroX || 1)
      cena.som.vultoGrito()
      cena.particulas.fumaca(this.x, this.y, 8)
    }

    if (this.estado === 'pairando') {
      this.irPara(this.casaX + Math.sin(this.tempo * 1.3) * 18, this.casaY + Math.sin(this.tempo * 2.1) * 6, 40, dt)
      const dx = Math.abs(iris.centroX - this.x)
      const dy = iris.centroY - this.y
      this.espera -= dt
      if (this.espera <= 0 && dx < 150 && dy > -20 && dy < 170) this.mudar('mergulhando')
    } else if (this.estado === 'mergulhando') {
      this.irPara(iris.centroX, iris.centroY, 105 + this.tempoEstado * 30, dt)
      if (this.tempoEstado > 2.4) this.mudar('voltando')
    } else if (this.estado === 'fugindo') {
      this.x += this.fugaX * 130 * dt
      this.y -= 70 * dt
      this.y = Math.max(20, this.y)
      if (this.tempoEstado > 1.2) this.mudar('voltando')
    } else if (this.estado === 'voltando') {
      if (this.irPara(this.casaX, this.casaY, 70, dt)) {
        this.mudar('pairando')
        this.espera = 1.2 + Math.random() * 1.5
      }
    }

    if (this.estado !== 'fugindo' && sobrepoe(this.caixa, iris)) {
      if (iris.machucar(this.x)) this.mudar('voltando')
    }

    this.relogioAsa -= dt
    if (this.relogioAsa <= 0) {
      this.relogioAsa = this.estado === 'mergulhando' ? 0.16 : 0.3
      if (Math.abs(iris.centroX - this.x) < 120) cena.som.asa()
    }
    const velocidadeAsa = this.estado === 'mergulhando' || this.estado === 'fugindo' ? 16 : 9
    const quadro = [0, 1, 2, 1][Math.floor(this.tempo * velocidadeAsa) % 4]
    this.sprite.texture = R.vulto[quadro]
    this.olhos.texture = R.vultoOlhos[quadro]
    const px = Math.round(this.x)
    const py = Math.round(this.y)
    this.sprite.position.set(px, py)
    this.olhos.position.set(px, py)
    this.olhos.visible = this.estado !== 'fugindo' || Math.floor(this.tempo * 20) % 2 === 0
  }
}
