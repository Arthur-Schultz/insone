import { Sprite } from 'pixi.js'
import { FISICA, LANTERNA } from '../config.js'
import { R } from '../core/Recursos.js'
import { mover } from './Fisica.js'

const ANIM = {
  parado: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  correndo: [2, 3, 4, 5]
}

export class Iris {
  constructor(cena, x, y) {
    this.cena = cena
    this.w = 10
    this.h = 20
    this.x = x + 3
    this.y = y + 16 - this.h
    this.vx = 0
    this.vy = 0
    this.direcao = 1
    this.noChao = false
    this.coyote = 0
    this.bufferPulo = 0
    this.atravessando = false
    this.tempoAtravessar = 0
    this.invencivel = 0
    this.semControle = 0
    this.sanidade = 3
    this.sanidadeMaxima = 3
    this.bateria = 100
    this.lanternaLigada = true
    this.piscar = 0
    this.tempoAnim = 0
    this.tempoPasso = 0
    this.avisouPilha = false
    this.empurrando = false
    this.sprite = new Sprite(R.iris[0])
    this.sprite.anchor.set(0.5, 1)
  }

  get centroX() {
    return this.x + this.w / 2
  }

  get centroY() {
    return this.y + this.h / 2
  }

  get lanternaX() {
    return this.centroX + this.direcao * 5
  }

  get lanternaY() {
    return this.y + this.h - 5
  }

  lanternaAtiva() {
    return this.lanternaLigada && this.bateria > 0 && this.piscar <= 0
  }

  alternarLanterna() {
    if (this.bateria <= 0) {
      this.cena.aviso('As pilhas acabaram...')
      this.cena.som.trancada()
      return
    }
    this.lanternaLigada = !this.lanternaLigada
    this.cena.som.lanterna(this.lanternaLigada)
  }

  recarregar(quantidade) {
    this.bateria = Math.min(100, this.bateria + quantidade)
    this.avisouPilha = false
    if (!this.lanternaLigada) this.lanternaLigada = true
  }

  machucar(origemX, empurrao = true) {
    if (this.invencivel > 0 || this.cena.modo !== 'jogando') return false
    this.sanidade--
    this.invencivel = 1.6
    this.cena.som.dano()
    this.cena.tremer(5, 0.35)
    this.cena.flashVermelho()
    if (empurrao) {
      this.vx = Math.sign(this.centroX - origemX || 1) * 150
      this.vy = -200
      this.semControle = 0.25
    }
    if (this.sanidade <= 0) this.cena.morrer()
    return true
  }

  atualizar(dt, entrada) {
    const cena = this.cena
    if (this.invencivel > 0) this.invencivel -= dt
    if (this.semControle > 0) this.semControle -= dt
    if (this.piscar > 0) this.piscar -= dt

    let alvo = 0
    if (this.semControle <= 0) {
      if (entrada.segurando('esquerda')) alvo -= FISICA.velocidadeAndar
      if (entrada.segurando('direita')) alvo += FISICA.velocidadeAndar
      if (alvo !== 0) this.direcao = Math.sign(alvo)
      const taxa = alvo === 0 ? FISICA.atrito : FISICA.aceleracao
      if (this.vx < alvo) this.vx = Math.min(alvo, this.vx + taxa * dt)
      else if (this.vx > alvo) this.vx = Math.max(alvo, this.vx - taxa * dt)
    }

    if (entrada.apertou('pulo')) this.bufferPulo = FISICA.bufferPulo
    else this.bufferPulo -= dt
    this.coyote = this.noChao ? FISICA.coyote : this.coyote - dt

    if (this.bufferPulo > 0 && this.coyote > 0 && this.semControle <= 0) {
      if (entrada.segurando('baixo') && this.sobrePlataforma) {
        this.tempoAtravessar = 0.22
      } else {
        this.vy = -FISICA.velocidadePulo
        cena.som.pulo()
      }
      this.bufferPulo = 0
      this.coyote = 0
    }
    if (entrada.apertou('baixo') && this.noChao && this.sobrePlataforma) this.tempoAtravessar = 0.22

    if (!entrada.segurando('pulo') && this.vy < -120 && this.semControle <= 0) this.vy += FISICA.gravidade * 1.6 * dt
    this.vy = Math.min(FISICA.quedaMaxima, this.vy + FISICA.gravidade * dt)

    this.tempoAtravessar -= dt
    this.atravessando = this.tempoAtravessar > 0

    if (entrada.apertou('lanterna')) this.alternarLanterna()
    if (this.lanternaLigada && this.bateria > 0) {
      this.bateria = Math.max(0, this.bateria - LANTERNA.consumo * dt)
      if (this.bateria < 20 && Math.random() < dt * 1.5) this.piscar = 0.05 + Math.random() * 0.12
      if (this.bateria < 20 && !this.avisouPilha) {
        this.avisouPilha = true
        cena.aviso('A lanterna está fraca...')
        cena.som.pilhaFraca()
      }
      if (this.bateria <= 0) {
        this.lanternaLigada = false
        cena.aviso('As pilhas acabaram! Procure mais.')
        cena.som.pilhaFraca()
      }
    }

    let dx = this.vx * dt
    this.empurrando = false
    if (this.noChao && dx !== 0) {
      for (const caixa of cena.caixas) {
        const alinhada = this.y + this.h > caixa.y + 2 && this.y < caixa.y + caixa.h
        if (!alinhada) continue
        const encostaDireita = dx > 0 && this.x + this.w <= caixa.x + 0.5 && this.x + this.w + dx > caixa.x
        const encostaEsquerda = dx < 0 && this.x >= caixa.x + caixa.w - 0.5 && this.x + dx < caixa.x + caixa.w
        if (encostaDireita || encostaEsquerda) {
          dx *= 0.55
          caixa.empurrar(dx)
          this.empurrando = true
        }
      }
    }

    const estavaNoChao = this.noChao
    const vyAntes = this.vy
    const r = mover(this, dx, this.vy * dt, cena.fase, cena.solidos())
    if (r.x) this.vx = 0
    if (r.y) this.vy = 0
    this.noChao = r.chao
    this.sobrePlataforma = r.chao && r.piso && r.piso.h === 1
    if (this.noChao && !estavaNoChao && vyAntes > 150) {
      cena.som.pouso()
      cena.particulas.poeira(this.centroX, this.y + this.h)
    }

    this.atualizarSprite(dt)
  }

  atualizarSprite(dt) {
    this.tempoAnim += dt
    let quadro
    if (!this.noChao) quadro = this.vy < 0 ? 6 : 7
    else if (Math.abs(this.vx) > 10) {
      const velocidade = this.empurrando ? 6 : 10
      quadro = ANIM.correndo[Math.floor(this.tempoAnim * velocidade) % ANIM.correndo.length]
      this.tempoPasso -= dt
      if (this.tempoPasso <= 0) {
        this.tempoPasso = this.empurrando ? 0.45 : 0.28
        this.cena.som.passo()
      }
    } else quadro = ANIM.parado[Math.floor(this.tempoAnim * 4) % ANIM.parado.length]
    this.sprite.texture = R.iris[quadro]
    this.sprite.scale.x = this.direcao
    this.sprite.position.set(Math.round(this.centroX), Math.round(this.y + this.h))
    this.sprite.alpha = this.invencivel > 0 && Math.floor(this.invencivel * 14) % 2 === 0 ? 0.35 : 1
  }
}
