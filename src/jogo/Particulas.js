import { Container, Sprite, Texture } from 'pixi.js'

export class Particulas {
  constructor() {
    this.container = new Container()
    this.lista = []
  }

  criar(x, y, { vx = 0, vy = 0, vida = 1, cor = 0xffffff, tamanho = 1, gravidade = 0, alpha = 1, encolher = true }) {
    const s = new Sprite(Texture.WHITE)
    s.width = tamanho
    s.height = tamanho
    s.tint = cor
    s.alpha = alpha
    s.position.set(x, y)
    this.container.addChild(s)
    this.lista.push({ s, vx, vy, vida, vidaTotal: vida, gravidade, alpha, tamanho, encolher })
  }

  poeira(x, y, quantidade = 6) {
    for (let i = 0; i < quantidade; i++) {
      this.criar(x + (Math.random() - 0.5) * 8, y - 1, { vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 30, vida: 0.4 + Math.random() * 0.3, cor: 0x8a7a70, tamanho: 2, alpha: 0.8 })
    }
  }

  fumaca(x, y, quantidade = 10) {
    for (let i = 0; i < quantidade; i++) {
      const cor = Math.random() < 0.3 ? 0x3a2466 : 0x0a0614
      this.criar(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 10, { vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 40, vida: 0.6 + Math.random() * 0.6, cor, tamanho: 2 + Math.round(Math.random() * 2), alpha: 0.9 })
    }
  }

  brilho(x, y, quantidade = 14) {
    for (let i = 0; i < quantidade; i++) {
      const a = (i / quantidade) * Math.PI * 2
      this.criar(x, y, { vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, vida: 0.5, cor: i % 2 ? 0x7effd4 : 0xffe6a0, tamanho: 2 })
    }
  }

  ambiente(cameraX, cameraY, largura, altura) {
    if (this.lista.length > 220 || Math.random() > 0.35) return
    this.criar(cameraX + Math.random() * largura, cameraY + Math.random() * altura, { vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 4, vida: 4 + Math.random() * 4, cor: 0xb8b0c8, tamanho: 1, alpha: 0.5, encolher: false })
  }

  atualizar(dt) {
    for (let i = this.lista.length - 1; i >= 0; i--) {
      const p = this.lista[i]
      p.vida -= dt
      if (p.vida <= 0) {
        p.s.destroy()
        this.lista.splice(i, 1)
        continue
      }
      p.vy += p.gravidade * dt
      p.s.x += p.vx * dt
      p.s.y += p.vy * dt
      const t = p.vida / p.vidaTotal
      p.s.alpha = p.alpha * Math.min(1, t * 2)
      if (p.encolher) {
        const tam = Math.max(1, Math.round(p.tamanho * t + 0.4))
        p.s.width = tam
        p.s.height = tam
      }
    }
  }
}
