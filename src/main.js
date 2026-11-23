import '@fontsource/vt323'
import './estilo.css'
import { Application } from 'pixi.js'
import { ALTURA, FONTE, LARGURA } from './config.js'
import { Entrada } from './core/Entrada.js'
import { carregarRecursos } from './core/Recursos.js'
import { Som } from './core/Som.js'
import { CenaTitulo } from './cenas/CenaTitulo.js'

class Jogo {
  constructor(app) {
    this.app = app
    this.entrada = new Entrada()
    this.som = new Som()
    this.cena = null
    this.proximaCena = null
  }

  trocarCena(cena) {
    this.proximaCena = cena
  }

  irParaTitulo() {
    this.trocarCena(new CenaTitulo(this))
  }

  aplicarTroca() {
    if (!this.proximaCena) return
    if (this.cena) {
      this.app.stage.removeChild(this.cena.raiz)
      this.cena.destruir()
    }
    this.cena = this.proximaCena
    this.proximaCena = null
    this.app.stage.addChild(this.cena.raiz)
  }

  passo(dt) {
    this.aplicarTroca()
    this.som.atualizar(dt)
    this.cena.atualizar(dt, this.entrada)
    this.entrada.limpar()
  }
}

function ajustarTela(canvas) {
  const escala = Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA)
  const final = escala >= 1 ? Math.floor(escala * 2) / 2 : escala
  canvas.style.width = `${Math.floor(LARGURA * final)}px`
  canvas.style.height = `${Math.floor(ALTURA * final)}px`
}

async function iniciar() {
  const app = new Application()
  await app.init({
    width: LARGURA,
    height: ALTURA,
    background: '#000000',
    antialias: false,
    resolution: 1,
    roundPixels: true,
    preference: 'webgl'
  })
  document.getElementById('jogo').appendChild(app.canvas)
  ajustarTela(app.canvas)
  window.addEventListener('resize', () => ajustarTela(app.canvas))
  await document.fonts.load(`16px ${FONTE}`)
  await carregarRecursos()
  const jogo = new Jogo(app)
  jogo.irParaTitulo()
  app.ticker.add((ticker) => jogo.passo(Math.min(ticker.deltaMS / 1000, 1 / 20)))
}

iniciar()
