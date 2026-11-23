import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { ALTURA, CORES, LARGURA } from '../config.js'
import { R, RETRATO } from '../core/Recursos.js'
import { lerProgresso, novaPartida } from '../core/Progresso.js'
import { FASES } from '../dados/fases.js'
import { Particulas } from '../jogo/Particulas.js'
import { Menu } from '../ui/Menu.js'
import { texto } from '../ui/Texto.js'
import { CenaJogo } from './CenaJogo.js'

const CONTROLES = [
  ['A / D  ou  ← / →', 'andar'],
  ['W / ESPAÇO / ↑', 'pular (segure para ir mais alto)'],
  ['S  ou  ↓', 'descer das prateleiras'],
  ['F', 'ligar / desligar a lanterna'],
  ['Q', 'alternar luz branca / ultravioleta'],
  ['E  ou  ENTER', 'interagir e avançar diálogos'],
  ['ESC  ou  P', 'pausar'],
  ['M', 'ligar / desligar o som']
]

const CREDITOS = [
  'INSONE  —  Grupo 20',
  '',
  'Arthur Schultz Marzaro',
  'Augusto Brando Almeida',
  'Eduardo de Oliveira Ferreira Filho',
  'Pedro Lucas de Souza Caniato',
  '',
  'Desenvolvimento de Jogos Digitais — UniAcademia',
  'Prof. Msc. Christien Lana Rachid',
  'Feito com PixiJS v8  •  Fonte VT323 (OFL)'
]

export class CenaTitulo {
  constructor(jogo) {
    this.jogo = jogo
    this.som = jogo.som
    this.raiz = new Container()
    this.tempo = 0
    this.estado = this.som.ctx ? 'menu' : 'inicio'
    this.construir()
    if (this.som.ctx) this.som.definirModo('titulo')
  }

  construir() {
    const fundo = new Graphics()
    for (let i = 0; i < 27; i++) {
      const t = i / 26
      const r = Math.round(5 + 15 * t)
      const g = Math.round(3 + 8 * t)
      const b = Math.round(8 + 28 * t)
      fundo.rect(0, i * 10, LARGURA, 10).fill((r << 16) | (g << 8) | b)
    }
    this.raiz.addChild(fundo)

    this.janela = new Sprite(R.janela[0])
    this.janela.scale.set(3)
    this.janela.position.set(40, 40)
    this.janela.alpha = 0.55
    this.raiz.addChild(this.janela)

    const chao = new TilingSprite({ texture: R.tiles[3], width: LARGURA, height: 24 })
    chao.position.set(0, ALTURA - 24)
    chao.tint = 0x555566
    this.raiz.addChild(chao)

    this.particulas = new Particulas()
    this.raiz.addChild(this.particulas.container)

    this.retrato = new Sprite(R.retratos[RETRATO.neutra])
    this.retrato.scale.set(4)
    this.retrato.anchor.set(0.5, 1)
    this.retrato.position.set(390, ALTURA - 24)
    this.raiz.addChild(this.retrato)

    this.sombraTitulo = texto('INSONE', { fill: 0xff2040, fontSize: 80 })
    this.sombraTitulo.anchor.set(0.5)
    this.sombraTitulo.alpha = 0.45
    this.tituloCiano = texto('INSONE', { fill: 0x40ffd0, fontSize: 80 })
    this.tituloCiano.anchor.set(0.5)
    this.tituloCiano.alpha = 0.35
    this.titulo = texto('INSONE', { fill: 0xe8e2f0, fontSize: 80 })
    this.titulo.anchor.set(0.5)
    this.raiz.addChild(this.sombraTitulo, this.tituloCiano, this.titulo)

    this.relogio = texto('03:33', { fill: 0xff3c50, fontSize: 22 })
    this.relogio.anchor.set(0.5)
    this.relogio.position.set(240, 98)
    this.raiz.addChild(this.relogio)

    this.pressione = texto('pressione ENTER', { fill: CORES.destaque, fontSize: 18 })
    this.pressione.anchor.set(0.5)
    this.pressione.position.set(240, 175)
    this.raiz.addChild(this.pressione)

    const progresso = lerProgresso()
    const opcoes = [{ rotulo: 'Novo jogo', acao: () => this.comecar(0) }]
    if (progresso.fase > 0 && progresso.fase < FASES.length) {
      opcoes.push({ rotulo: `Continuar (fase ${progresso.fase + 1})`, acao: () => this.comecar(progresso.fase) })
    }
    opcoes.push({ rotulo: 'Controles', acao: () => this.abrirPainel(CONTROLES, 'CONTROLES', 'A pilha da lanterna não dura para sempre.') })
    opcoes.push({ rotulo: 'Créditos', acao: () => this.abrirPainel(CREDITOS.map((l) => [l]), 'CRÉDITOS') })
    this.menu = new Menu(this.som, opcoes, { y: 140, espaco: 20, tamanho: 20 })
    this.menu.container.visible = false
    this.raiz.addChild(this.menu.container)

    if (progresso.melhorTempo) {
      const m = Math.floor(progresso.melhorTempo / 60)
      const s = Math.floor(progresso.melhorTempo % 60).toString().padStart(2, '0')
      this.recorde = texto(`melhor tempo: ${m}:${s}`, { fill: 0x6a6280, fontSize: 14 })
      this.recorde.position.set(8, ALTURA - 18)
      this.raiz.addChild(this.recorde)
    }
    const rodape = texto('Grupo 20 • UniAcademia', { fill: 0x6a6280, fontSize: 14 })
    rodape.anchor.set(1, 0)
    rodape.position.set(LARGURA - 8, ALTURA - 18)
    this.raiz.addChild(rodape)

    this.painel = new Container()
    this.painel.visible = false
    this.raiz.addChild(this.painel)

    const vinheta = new Sprite(R.luz.vinheta)
    vinheta.scale.set(2)
    this.raiz.addChild(vinheta)
    this.granulado = new TilingSprite({ texture: R.luz.granulado, width: LARGURA, height: ALTURA })
    this.granulado.alpha = 0.06
    this.raiz.addChild(this.granulado)

    this.fade = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0x000000)
    this.fade.alpha = 1
    this.raiz.addChild(this.fade)
    this.saindo = false
    this.atualizarModo()
  }

  atualizarModo() {
    const menu = this.estado === 'menu'
    this.menu.container.visible = menu
    this.pressione.visible = this.estado === 'inicio'
    this.painel.visible = this.estado === 'painel'
  }

  abrirPainel(linhas, titulo, rodape) {
    this.painel.removeChildren()
    const caixa = new Graphics().rect(24, 16, 432, 238).fill({ color: 0x0b0812, alpha: 0.96 }).stroke({ color: CORES.bordaCaixa, width: 2 })
    const cab = texto(titulo, { fill: CORES.destaque, fontSize: 24 })
    cab.anchor.set(0.5, 0)
    cab.position.set(240, 24)
    this.painel.addChild(caixa, cab)
    const duasColunas = linhas[0].length > 1
    linhas.forEach((linha, i) => {
      const y = duasColunas ? 60 + i * 18 : 56 + i * 17
      if (duasColunas) {
        const tecla = texto(linha[0], { fill: 0xc8c0d8, fontSize: 16 })
        tecla.position.set(44, y)
        const acao = texto(linha[1], { fill: CORES.texto, fontSize: 16 })
        acao.position.set(190, y)
        this.painel.addChild(tecla, acao)
      } else {
        const t = texto(linha[0], { fill: i === 0 ? CORES.destaque : CORES.texto, fontSize: 16 })
        t.anchor.set(0.5, 0)
        t.position.set(240, y - 4)
        this.painel.addChild(t)
      }
    })
    if (rodape) {
      const r = texto(rodape, { fill: 0x8a82a0, fontSize: 16 })
      r.anchor.set(0.5, 0)
      r.position.set(240, 200)
      this.painel.addChild(r)
    }
    const voltar = texto('ENTER ou ESC para voltar', { fill: 0x6a6280, fontSize: 14 })
    voltar.anchor.set(0.5, 0)
    voltar.position.set(240, 232)
    this.painel.addChild(voltar)
    this.estado = 'painel'
    this.atualizarModo()
  }

  comecar(fase) {
    if (this.saindo) return
    this.saindo = true
    this.faseEscolhida = fase
  }

  atualizar(dt, entrada) {
    this.tempo += dt
    if (entrada.apertou('mudo') && this.som.ctx) this.som.alternarMudo()

    if (this.estado === 'inicio') {
      this.pressione.alpha = 0.5 + Math.sin(this.tempo * 4) * 0.5
      if (entrada.algumaTecla()) {
        this.som.iniciar()
        this.som.definirModo('titulo')
        this.som.confirmarMenu()
        this.estado = 'menu'
        this.atualizarModo()
      }
    } else if (this.estado === 'menu' && !this.saindo) {
      this.menu.atualizar(dt, entrada)
    } else if (this.estado === 'painel') {
      if (entrada.apertou('confirmar') || entrada.apertou('voltar')) {
        this.som.menu()
        this.estado = 'menu'
        this.atualizarModo()
      }
    }

    const glitch = Math.random() < 0.04
    const ox = glitch ? (Math.random() - 0.5) * 8 : Math.sin(this.tempo * 1.3) * 1.2
    this.titulo.position.set(240, 58)
    this.sombraTitulo.position.set(240 + ox + 1.5, 58)
    this.tituloCiano.position.set(240 - ox - 1.5, 58 + (glitch ? 2 : 0))
    this.titulo.alpha = glitch ? 0.6 : 1
    this.relogio.alpha = Math.floor(this.tempo * 1.2) % 2 === 0 ? 1 : 0.35

    const ciclo = this.tempo % 4
    this.retrato.texture = R.retratos[ciclo > 3.85 ? RETRATO.olhos_fechados : RETRATO.neutra]
    this.retrato.y = ALTURA - 24 + Math.round(Math.sin(this.tempo * 1.5))
    this.janela.texture = R.janela[this.tempo % 9 > 8.8 ? 1 : 0]

    this.particulas.ambiente(0, 0, LARGURA, ALTURA)
    this.particulas.atualizar(dt)
    this.granulado.tilePosition.set(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128))

    if (this.saindo) {
      this.fade.alpha = Math.min(1, this.fade.alpha + dt * 1.8)
      if (this.fade.alpha >= 1) this.jogo.trocarCena(new CenaJogo(this.jogo, this.faseEscolhida, novaPartida()))
    } else this.fade.alpha = Math.max(0, this.fade.alpha - dt * 1.5)
  }

  destruir() {
    this.raiz.destroy({ children: true })
  }
}
