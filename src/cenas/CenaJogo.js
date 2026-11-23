import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { ALTURA, CORES, LANTERNA, LARGURA, TILE } from '../config.js'
import { R } from '../core/Recursos.js'
import { salvarProgresso } from '../core/Progresso.js'
import { FASES } from '../dados/fases.js'
import { Coisa } from '../jogo/Coisa.js'
import { Fase } from '../jogo/Fase.js'
import { sobrepoe } from '../jogo/Fisica.js'
import { Iluminacao } from '../jogo/Iluminacao.js'
import { Iris } from '../jogo/Iris.js'
import { Alavanca, Bilhete, Caixa, Item, Janela, Marca, Placa, Porta, Portao, Saida, Teclado, Vela } from '../jogo/Objetos.js'
import { Particulas } from '../jogo/Particulas.js'
import { Sombra } from '../jogo/Sombra.js'
import { Vulto } from '../jogo/Vulto.js'
import { Dialogo } from '../ui/Dialogo.js'
import { Hud } from '../ui/Hud.js'
import { Menu } from '../ui/Menu.js'
import { PainelCodigo } from '../ui/PainelCodigo.js'
import { texto } from '../ui/Texto.js'
import { CenaFinal } from './CenaFinal.js'

export class CenaJogo {
  constructor(jogo, indice, partida) {
    this.jogo = jogo
    this.som = jogo.som
    this.indice = indice
    this.dados = FASES[indice]
    this.estado = partida
    this.estado.temChave = false
    this.raiz = new Container()
    this.modo = 'intro'
    this.relogioIntro = 0.9
    this.tempo = 0
    this.camera = { x: 0, y: 0 }
    this.tremorForca = 0
    this.tremorTempo = 0
    this.perseguindo = false
    this.coisa = null
    this.construir()
    salvarProgresso({ fase: indice })
    this.som.definirModo('jogo')
  }

  construir() {
    const dados = this.dados
    this.fase = new Fase(dados)
    this.mundo = new Container()
    this.acima = new Container()
    this.camadaObjetos = new Container()
    this.camadaEntidades = new Container()
    this.particulas = new Particulas()
    this.mundo.addChild(this.fase.criarCenario(), this.camadaObjetos, this.camadaEntidades, this.particulas.container)

    this.sombras = []
    this.vultos = []
    this.marcas = []
    this.caixas = []
    this.portas = []
    this.portoes = []
    this.placas = []
    this.itens = []
    this.bilhetes = []
    this.velas = []
    this.janelas = []
    this.teclados = []
    this.alavancas = []
    this.saidas = []
    this.gatilhos = []
    let inicio = { x: 32, y: 200 }
    const notas = []
    const marcas = []

    this.fase.percorrer((c, tx, ty) => {
      const acima = this.fase.char(tx, ty - 1)
      if (c === 'P') inicio = { x: tx * TILE, y: ty * TILE }
      if (c === 'S') this.sombras.push(new Sombra(this, tx * TILE, ty * TILE))
      if (c === 'U') this.vultos.push(new Vulto(this, tx * TILE, ty * TILE))
      if (c === 'm') marcas.push({ tx, ty })
      if (c === 'C') this.caixas.push(new Caixa(this, tx, ty))
      if (c === 'K') this.itens.push(new Item(this, tx, ty, 'chave'))
      if (c === 'B') this.itens.push(new Item(this, tx, ty, 'pilha'))
      if (c === 'V') this.itens.push(new Item(this, tx, ty, 'coracao'))
      if (c === 'N') notas.push({ tx, ty })
      if (c === 'c') this.velas.push(new Vela(this, tx, ty))
      if (c === 'L') this.alavancas.push(new Alavanca(this, tx, ty))
      if (c === '_') this.placas.push(new Placa(this, tx, ty))
      if (c === 'D') this.portas.push(new Porta(this, tx, ty, 'chave'))
      if (c === 'E') this.portas.push(new Porta(this, tx, ty, 'codigo'))
      if (c === 'T') this.teclados.push(new Teclado(this, tx, ty))
      if (c === 'X') this.saidas.push(new Saida(this, tx, ty))
      if (c === 'w') this.janelas.push(new Janela(this, tx, ty))
      if (c === '!') this.gatilhos.push({ x: tx * TILE, disparado: false })
      if (c === 'A') this.pontoCoisa = { x: tx * TILE, y: ty * TILE }
      if ((c === 'G' || c === 'H') && acima !== c) {
        let base = ty
        while (this.fase.char(tx, base + 1) === c) base++
        this.portoes.push(new Portao(this, tx, ty, base, c === 'G' ? 'alavanca' : 'placa'))
      }
    })
    notas.sort((a, b) => a.tx - b.tx)
    notas.forEach((n, i) => this.bilhetes.push(new Bilhete(this, n.tx, n.ty, i)))
    marcas.sort((a, b) => a.tx - b.tx)
    marcas.forEach((m, i) => this.marcas.push(new Marca(this, m.tx, m.ty, i)))
    this.alavancas.sort((a, b) => a.x - b.x)
    this.gatilhos.sort((a, b) => a.x - b.x)
    this.gatilhos.forEach((g, i) => (g.evento = dados.eventos[i]))

    const fundoObjetos = [...this.janelas, ...this.marcas, ...this.saidas, ...this.portas, ...this.teclados, ...this.bilhetes, ...this.alavancas, ...this.placas, ...this.velas, ...this.portoes]
    for (const o of fundoObjetos) this.camadaObjetos.addChild(o.sprite)
    for (const o of [...this.caixas, ...this.itens]) this.camadaObjetos.addChild(o.sprite)
    for (const s of [...this.sombras, ...this.vultos]) {
      this.camadaEntidades.addChild(s.sprite)
      this.acima.addChild(s.olhos)
    }
    for (const j of this.janelas) this.acima.addChild(j.brilho)
    this.interagiveis = [...this.portas, ...this.alavancas, ...this.bilhetes, ...this.marcas, ...this.teclados]

    this.iris = new Iris(this, inicio.x, inicio.y)
    this.camadaEntidades.addChild(this.iris.sprite)
    this.checkpoint = { x: inicio.x, y: inicio.y }
    this.camera.x = this.alvoCameraX()
    this.camera.y = this.alvoCameraY()

    this.iluminacao = new Iluminacao(this.jogo.app.renderer, dados.ambiente)

    this.dica = texto('', { fill: CORES.destaque, fontSize: 14, stroke: { color: 0x000000, width: 3 } })
    this.dica.anchor.set(0.5, 1)
    this.acima.addChild(this.dica)

    this.vinheta = new Sprite(R.luz.vinheta)
    this.vinheta.scale.set(2)
    this.granulado = new TilingSprite({ texture: R.luz.granulado, width: LARGURA, height: ALTURA })
    this.granulado.alpha = 0.05
    this.alerta = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0xff0020)
    this.alerta.alpha = 0
    this.flash = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0xff1030)
    this.flash.alpha = 0
    this.hud = new Hud(dados.nome)
    this.dialogo = new Dialogo(this.som)
    this.painel = new PainelCodigo(this.som, dados.codigo || '0000', dados.ordemCodigo)
    this.sobreposicao = new Container()
    this.fade = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0x000000)
    this.fade.alpha = 1
    this.fadeAlvo = 0
    this.titulo = texto(`${this.indice + 1}. ${dados.nome.toUpperCase()}`, { fill: 0xc8c0d8, fontSize: 32, stroke: { color: 0x000000, width: 4 } })
    this.titulo.anchor.set(0.5)
    this.titulo.position.set(LARGURA / 2, 70)
    this.titulo.alpha = 0

    this.raiz.addChild(
      this.mundo,
      this.iluminacao.sprite,
      this.acima,
      this.vinheta,
      this.alerta,
      this.granulado,
      this.flash,
      this.hud.container,
      this.titulo,
      this.dialogo.container,
      this.painel.container,
      this.sobreposicao,
      this.fade
    )
  }

  solidos() {
    const lista = []
    for (const p of this.portas) if (p.bloqueia) lista.push(p)
    for (const p of this.portoes) if (p.bloqueia) lista.push(p)
    for (const c of this.caixas) lista.push(c)
    return lista
  }

  bloqueiaLuz(x, y) {
    if (this.fase.solido(Math.floor(x / TILE), Math.floor(y / TILE))) return true
    for (const p of this.portas) if (p.bloqueia && x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true
    for (const p of this.portoes) if (p.bloqueia && x >= p.x - 2 && x <= p.x + p.w + 2 && y >= p.y && y <= p.y + p.h) return true
    return false
  }

  temVisao(x0, y0, x1, y1) {
    const passos = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4)
    for (let i = 1; i < passos; i++) {
      const t = i / passos
      if (this.bloqueiaLuz(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false
    }
    return true
  }

  alcanceLivre(maximo) {
    const iris = this.iris
    for (let d = 4; d < maximo; d += 4) {
      if (this.bloqueiaLuz(iris.lanternaX + d * iris.direcao, iris.lanternaY)) return d
    }
    return maximo
  }

  estaIluminado(x, y) {
    const iris = this.iris
    if (iris.lanternaAtiva()) {
      const dx = (x - iris.lanternaX) * iris.direcao
      const dy = y - iris.lanternaY
      const perto = Math.hypot(dx, dy) < 22
      const noCone = dx > 0 && dx < LANTERNA.alcance && Math.abs(dy) < dx * LANTERNA.aberturaVertical + 8
      if ((perto || noCone) && this.temVisao(iris.lanternaX, iris.lanternaY, x, y)) return true
    }
    for (const v of this.velas) {
      if (v.acesa && Math.hypot(x - (v.x + 8), y - (v.y + 8)) < 42 && this.temVisao(v.x + 8, v.y + 6, x, y)) return true
    }
    return false
  }

  aviso(mensagem) {
    this.hud.mostrarAviso(mensagem)
  }

  tremer(forca, tempo) {
    this.tremorForca = Math.max(this.tremorForca, forca)
    this.tremorTempo = Math.max(this.tremorTempo, tempo)
  }

  flashVermelho() {
    this.flash.alpha = 0.45
  }

  definirCheckpoint(x, y) {
    this.checkpoint = { x, y }
  }

  iniciarDialogo(falas, aoTerminar) {
    this.modo = 'dialogo'
    this.dica.visible = false
    this.iris.vx = 0
    this.dialogo.iniciar(falas, () => {
      if (this.modo === 'dialogo') this.modo = 'jogando'
      if (aoTerminar) aoTerminar()
    })
  }

  lerBilhete(indice) {
    const bilhete = this.bilhetes[indice]
    if (!bilhete.contado) {
      bilhete.contado = true
      this.estado.bilhetes++
    }
    this.iniciarDialogo(this.dados.bilhetes[indice] || [{ t: '...' }])
  }

  examinarMarca(indice) {
    this.iniciarDialogo(this.dados.marcas[indice] || [{ t: '...' }])
  }

  verificarAlavancas() {
    const padrao = this.dados.alavancas
    const posicoes = this.alavancas.map((a) => a.ligada)
    const certo = padrao ? padrao.every((v, i) => v === posicoes[i]) : posicoes.some(Boolean)
    const portoes = this.portoes.filter((p) => p.grupo === 'alavanca')
    const jaAberto = portoes.some((p) => p.alvo === 1)
    portoes.forEach((p) => p.definir(certo))
    if (certo && !jaAberto) {
      this.aviso('Algo pesado rangeu ao longe...')
      this.tremer(2, 0.4)
    } else if (!certo && jaAberto) this.aviso('Um estalo metálico ecoou pelo porão.')
    else this.aviso('Clack.')
  }

  abrirPainelCodigo() {
    this.modo = 'codigo'
    this.dica.visible = false
    this.painel.abrir(
      () => {
        this.modo = 'jogando'
        this.portas.filter((p) => p.tipo === 'codigo').forEach((p) => p.abrir())
        this.aviso('Clique. O cadeado abriu.')
      },
      () => {
        this.modo = 'jogando'
      }
    )
  }

  transicao(meio, duracao = 0.35) {
    this.modo = 'transicao'
    this.fadeAlvo = 1
    this.velocidadeFade = 1 / duracao
    this.aoEscurecer = meio
  }

  danoAmbiente(origemX) {
    if (this.modo !== 'jogando') return
    const iris = this.iris
    iris.sanidade--
    this.som.dano()
    this.tremer(5, 0.35)
    this.flashVermelho()
    if (iris.sanidade <= 0) {
      this.morrer()
      return
    }
    this.transicao(() => this.renascer(false))
  }

  pegoPelaCoisa() {
    if (this.modo !== 'jogando') return
    this.iris.sanidade = 0
    this.som.dano()
    this.som.rugido()
    this.tremer(8, 0.6)
    this.flashVermelho()
    this.morrer()
  }

  pararPerseguicao() {
    if (this.coisa) {
      this.coisa.destruir()
      this.coisa = null
    }
    if (this.perseguindo) {
      this.perseguindo = false
      this.som.definirModo('jogo')
      for (const g of this.gatilhos) if (g.evento && g.evento.tipo === 'perseguicao') g.disparado = false
    }
  }

  renascer(completo) {
    const iris = this.iris
    this.pararPerseguicao()
    for (const a of this.alavancas) {
      if (this.dados.reiniciarAlavancas && a.ligada) {
        a.ligada = false
        a.sprite.texture = a.texturaDesligada
      }
    }
    if (this.dados.reiniciarAlavancas) this.portoes.filter((p) => p.grupo === 'alavanca').forEach((p) => {
      p.alvo = 0
      p.abertura = 0
      p.sprite.height = p.alturaTotal
      p.sprite.visible = true
    })
    iris.x = this.checkpoint.x + 3
    iris.y = this.checkpoint.y + TILE - iris.h
    iris.vx = 0
    iris.vy = 0
    iris.invencivel = 1.2
    iris.semControle = 0
    for (const v of this.vultos) {
      v.x = v.casaX
      v.y = v.casaY
      v.mudar('pairando')
      v.espera = 2
    }
    if (completo) {
      iris.sanidade = iris.sanidadeMaxima
      iris.bateria = Math.max(iris.bateria, 60)
      iris.lanternaLigada = true
    }
    this.camera.x = this.alvoCameraX()
    this.camera.y = this.alvoCameraY()
    this.modo = 'jogando'
  }

  morrer() {
    if (this.modo === 'gameover') return
    this.modo = 'gameover'
    this.estado.mortes++
    this.som.morte()
    this.som.batimento(0)
    this.dica.visible = false
    this.sobreposicao.removeChildren()
    const fundo = new Graphics().rect(0, 0, LARGURA, ALTURA).fill({ color: 0x000000, alpha: 0.78 })
    const titulo = texto('O ESCURO VENCEU', { fill: CORES.perigo, fontSize: 40, stroke: { color: 0x000000, width: 4 } })
    titulo.anchor.set(0.5)
    titulo.position.set(LARGURA / 2, 90)
    const sub = texto('A Iris perdeu toda a sanidade.', { fill: 0x8a82a0, fontSize: 16 })
    sub.anchor.set(0.5)
    sub.position.set(LARGURA / 2, 122)
    this.menuGameOver = new Menu(this.som, [
      { rotulo: 'Tentar de novo', acao: () => this.fecharSobreposicao(() => this.transicao(() => this.renascer(true))) },
      { rotulo: 'Menu principal', acao: () => this.irParaMenu() }
    ], { y: 160 })
    this.sobreposicao.addChild(fundo, titulo, sub, this.menuGameOver.container)
    this.sobreposicao.alpha = 0
    this.esperaGameOver = 0.8
  }

  abrirPausa() {
    this.modo = 'pausa'
    this.dica.visible = false
    this.sobreposicao.removeChildren()
    const fundo = new Graphics().rect(0, 0, LARGURA, ALTURA).fill({ color: 0x000000, alpha: 0.7 })
    const titulo = texto('PAUSADO', { fill: 0xc8c0d8, fontSize: 40 })
    titulo.anchor.set(0.5)
    titulo.position.set(LARGURA / 2, 80)
    const info = texto(`Bilhetes lidos: ${this.estado.bilhetes}   •   Sombras dissolvidas: ${this.estado.sombras}   •   M: som ${this.som.mudo ? 'desligado' : 'ligado'}`, { fill: 0x6a6280, fontSize: 14 })
    info.anchor.set(0.5)
    info.position.set(LARGURA / 2, 230)
    this.menuPausa = new Menu(this.som, [
      { rotulo: 'Continuar', acao: () => this.fecharSobreposicao() },
      { rotulo: 'Voltar ao último checkpoint', acao: () => this.fecharSobreposicao(() => this.transicao(() => this.renascer(false))) },
      { rotulo: 'Reiniciar fase', acao: () => this.reiniciarFase() },
      { rotulo: 'Menu principal', acao: () => this.irParaMenu() }
    ], { y: 125 })
    this.sobreposicao.addChild(fundo, titulo, this.menuPausa.container, info)
    this.sobreposicao.alpha = 1
  }

  fecharSobreposicao(depois) {
    this.sobreposicao.removeChildren()
    this.modo = 'jogando'
    if (depois) depois()
  }

  reiniciarFase() {
    this.sobreposicao.removeChildren()
    this.transicao(() => this.jogo.trocarCena(new CenaJogo(this.jogo, this.indice, this.estado)))
  }

  irParaMenu() {
    this.sobreposicao.removeChildren()
    this.transicao(() => this.jogo.irParaTitulo())
  }

  concluirFase() {
    if (this.modo !== 'jogando') return
    this.pararPerseguicao()
    this.som.batimento(0)
    const proxima = this.indice + 1
    if (this.dados.final) {
      salvarProgresso({ fase: 0 })
      this.iniciarDialogo(this.dados.final, () => {
        this.som.definirModo('final')
        this.transicao(() => this.jogo.trocarCena(new CenaFinal(this.jogo, this.estado)), 1.6)
      })
      return
    }
    salvarProgresso({ fase: proxima })
    this.som.porta()
    this.transicao(() => this.jogo.trocarCena(new CenaJogo(this.jogo, proxima, this.estado)), 0.8)
  }

  dispararEvento(gatilho) {
    gatilho.disparado = true
    const evento = gatilho.evento
    if (!evento) return
    if (evento.tipo === 'dialogo') this.iniciarDialogo(evento.falas)
    if (evento.tipo === 'susto') {
      let janela = null
      for (const j of this.janelas) {
        if (!janela || Math.abs(j.x - this.iris.x) < Math.abs(janela.x - this.iris.x)) janela = j
      }
      if (janela) janela.mostrarOlhos(2.2)
      this.som.susto()
      this.tremer(4, 0.6)
      this.iniciarDialogo(evento.falas)
    }
    if (evento.tipo === 'perseguicao') {
      this.som.rugido()
      this.tremer(6, 1.2)
      this.iniciarDialogo(evento.falas, () => {
        const ponto = this.pontoCoisa || { x: this.iris.x - 180, y: this.iris.y - 20 }
        this.coisa = new Coisa(this, ponto.x, ponto.y - 24)
        this.camadaEntidades.addChild(this.coisa.sprite)
        this.acima.addChild(this.coisa.olhos)
        this.perseguindo = true
        this.som.definirModo('perseguicao')
      })
    }
  }

  alvoCameraX() {
    const x = this.iris.centroX - LARGURA / 2 + this.iris.direcao * 28
    return Math.max(0, Math.min(this.fase.larguraPx - LARGURA, x))
  }

  alvoCameraY() {
    const y = this.iris.centroY - ALTURA * 0.58
    return Math.max(0, Math.min(this.fase.alturaPx - ALTURA, y))
  }

  atualizarJogo(dt, entrada) {
    const iris = this.iris
    this.estado.tempo += dt
    if (entrada.apertou('pausa')) {
      this.abrirPausa()
      return
    }
    if (entrada.digitou('insone')) {
      this.aviso('Atalho de apresentação: pulando fase...')
      this.concluirFase()
      return
    }
    iris.atualizar(dt, entrada)
    for (const c of this.caixas) c.atualizar(dt)
    for (const p of this.placas) p.atualizar()
    const pressionada = this.placas.some((p) => p.pressionada)
    for (const p of this.portoes) {
      if (p.grupo === 'placa') p.definir(pressionada)
      p.atualizar(dt)
    }
    for (const s of this.sombras) {
      const viva = !s.morta
      s.atualizar(dt)
      if (viva && s.morta) this.estado.sombras++
    }
    for (const v of this.vultos) v.atualizar(dt)
    for (const i of this.itens) i.atualizar(dt)
    for (const v of this.velas) v.atualizar(dt)
    for (const j of this.janelas) j.atualizar(dt)
    if (this.coisa) this.coisa.atualizar(dt)
    if (this.modo !== 'jogando') return

    let alvo = null
    let melhor = Infinity
    const area = { x: iris.x - 6, y: iris.y - 4, w: iris.w + 12, h: iris.h + 8 }
    for (const o of this.interagiveis) {
      if (o.aberta) continue
      if (!sobrepoe(area, o)) continue
      const d = Math.abs(o.x + o.w / 2 - iris.centroX)
      if (d < melhor) {
        melhor = d
        alvo = o
      }
    }
    if (alvo) {
      this.dica.visible = true
      this.dica.text = `[E] ${alvo.rotulo}`
      this.dica.position.set(Math.round(alvo.x + alvo.w / 2), Math.round(alvo.y - 3 + Math.sin(this.tempo * 5)))
      if (entrada.apertou('interagir')) alvo.interagir()
    } else this.dica.visible = false
    if (this.modo !== 'jogando') return

    const pes = { x: iris.x + 2, y: iris.y + iris.h - 6, w: iris.w - 4, h: 6 }
    let espinho = false
    const x0 = Math.floor(pes.x / TILE)
    const x1 = Math.floor((pes.x + pes.w) / TILE)
    const ty = Math.floor((pes.y + pes.h - 1) / TILE)
    for (let tx = x0; tx <= x1; tx++) {
      if (this.fase.char(tx, ty) === '^' && pes.y + pes.h > ty * TILE + 9) espinho = true
    }
    if (espinho || iris.y > this.fase.alturaPx + 24) {
      this.danoAmbiente(iris.centroX)
      return
    }

    for (const g of this.gatilhos) {
      if (!g.disparado && iris.centroX >= g.x) {
        this.dispararEvento(g)
        return
      }
    }

    for (const s of this.saidas) {
      if (sobrepoe(iris, s)) {
        this.concluirFase()
        return
      }
    }

    let proximidade = 0
    for (const s of [...this.sombras, ...this.vultos]) {
      if (s.morta) continue
      const d = Math.hypot(s.centroX - iris.centroX, s.centroY - iris.centroY)
      proximidade = Math.max(proximidade, 1 - (d - 30) / 170)
    }
    if (this.coisa) proximidade = Math.max(proximidade, 1 - (iris.centroX - this.coisa.centroX - 40) / 260)
    this.som.batimento(Math.max(0, Math.min(1, proximidade)))
  }

  coletarLuzes() {
    const luzes = []
    const iris = this.iris
    const cam = this.camera
    const visivel = (x, y, margem = 90) => x > cam.x - margem && x < cam.x + LARGURA + margem && y > cam.y - margem && y < cam.y + ALTURA + margem
    luzes.push({ x: iris.centroX, y: iris.centroY, raio: 54, cor: 0xa898c0, intensidade: 0.75 })
    if (iris.lanternaAtiva()) {
      const forca = iris.bateria < 20 ? 0.75 : 1
      const livre = this.alcanceLivre(170) + 14
      luzes.push({ cone: true, x: iris.lanternaX, y: iris.lanternaY, alcance: Math.min(170, livre), direcao: iris.direcao, cor: 0xffe6b0, intensidade: forca })
      luzes.push({ cone: true, x: iris.lanternaX, y: iris.lanternaY, alcance: Math.min(120, livre), direcao: iris.direcao, cor: 0xfff0d0, intensidade: 0.7 * forca })
      luzes.push({ x: iris.lanternaX, y: iris.lanternaY, raio: 28, cor: 0xffd890, intensidade: 0.8 * forca })
    }
    for (const v of this.velas) {
      if (!visivel(v.x, v.y)) continue
      const tremula = 1 + Math.sin(this.tempo * 13 + v.x) * 0.05 + Math.sin(this.tempo * 7.3) * 0.04
      if (v.acesa) luzes.push({ x: v.x + 8, y: v.y + 6, raio: 62 * tremula, cor: 0xffa050, intensidade: 0.95 })
      else luzes.push({ x: v.x + 8, y: v.y + 10, raio: 16, cor: 0xffa050, intensidade: 0.35 })
    }
    for (const j of this.janelas) {
      if (!visivel(j.x, j.y)) continue
      luzes.push({ x: j.x + 16, y: j.y + 18, raio: 78, cor: 0x4a64b8, intensidade: 0.75 })
      if (j.olhos > 0) luzes.push({ x: j.x + 16, y: j.y + 13, raio: 34, cor: 0xff1030, intensidade: 0.8 })
    }
    const cores = { chave: 0xffd060, pilha: 0x5aff8c, coracao: 0xff6080 }
    for (const i of this.itens) {
      if (i.coletado || !visivel(i.baseX, i.baseY)) continue
      luzes.push({ x: i.baseX, y: i.baseY, raio: 18 + Math.sin(this.tempo * 3) * 2, cor: cores[i.tipo], intensidade: 0.7 })
    }
    for (const b of this.bilhetes) {
      if (visivel(b.x, b.y)) luzes.push({ x: b.x + 8, y: b.y + 8, raio: b.lido ? 10 : 16, cor: 0xe8dcbe, intensidade: 0.5 })
    }
    for (const t of this.teclados) if (visivel(t.x, t.y)) luzes.push({ x: t.x + 8, y: t.y + 6, raio: 18, cor: 0x5aff8c, intensidade: 0.6 })
    for (const s of this.saidas) if (visivel(s.x, s.y)) luzes.push({ x: s.x + 5, y: s.y + 18, raio: 46, cor: 0xffc070, intensidade: 0.7 })
    if (this.coisa) luzes.push({ x: this.coisa.centroX, y: this.coisa.centroY, raio: 70, cor: 0x6a2040, intensidade: 0.8 })
    return luzes
  }

  atualizarCamera(dt) {
    this.camera.x += (this.alvoCameraX() - this.camera.x) * Math.min(1, dt * 6)
    this.camera.y += (this.alvoCameraY() - this.camera.y) * Math.min(1, dt * 5)
    let ox = 0
    let oy = 0
    if (this.tremorTempo > 0) {
      this.tremorTempo -= dt
      ox = (Math.random() - 0.5) * 2 * this.tremorForca
      oy = (Math.random() - 0.5) * 2 * this.tremorForca
      if (this.tremorTempo <= 0) this.tremorForca = 0
    }
    if (this.perseguindo) ox += (Math.random() - 0.5) * 1.5
    const cx = Math.round(this.camera.x + ox)
    const cy = Math.round(this.camera.y + oy)
    this.mundo.position.set(-cx, -cy)
    this.acima.position.set(-cx, -cy)
    return { cx, cy }
  }

  atualizar(dt, entrada) {
    this.tempo += dt
    if (entrada.apertou('mudo')) this.aviso(this.som.alternarMudo() ? 'Som desligado (M)' : 'Som ligado (M)')

    if (this.modo === 'intro') {
      this.relogioIntro -= dt
      if (this.relogioIntro <= 0) this.iniciarDialogo(this.dados.intro)
    } else if (this.modo === 'jogando') this.atualizarJogo(dt, entrada)
    else if (this.modo === 'dialogo') this.dialogo.atualizar(dt, entrada)
    else if (this.modo === 'codigo') this.painel.atualizar(dt, entrada)
    else if (this.modo === 'pausa') {
      if (entrada.apertou('pausa')) this.fecharSobreposicao()
      else this.menuPausa.atualizar(dt, entrada)
    } else if (this.modo === 'gameover') {
      this.esperaGameOver -= dt
      this.sobreposicao.alpha = Math.min(1, this.sobreposicao.alpha + dt * 2)
      if (this.esperaGameOver <= 0) this.menuGameOver.atualizar(dt, entrada)
    }

    if (this.modo !== 'pausa' && this.modo !== 'gameover') this.particulas.atualizar(dt)
    const { cx, cy } = this.atualizarCamera(dt)
    this.particulas.ambiente(cx, cy, LARGURA, ALTURA)
    this.iris.atualizarSprite(0)
    this.iluminacao.desenhar(cx, cy, this.coletarLuzes())
    this.hud.atualizar(dt, this.iris, this.estado)
    this.hud.container.visible = this.modo !== 'dialogo' && this.modo !== 'codigo'
    this.granulado.tilePosition.set(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128))
    this.flash.alpha = Math.max(0, this.flash.alpha - dt * 1.5)
    this.alerta.alpha = this.perseguindo ? 0.03 + Math.max(0, Math.sin(this.tempo * 7.5)) * 0.05 : Math.max(0, this.alerta.alpha - dt)

    if (this.tempo < 4.5) this.titulo.alpha = Math.min(1, this.tempo / 0.8) * Math.min(1, (4.5 - this.tempo) / 1)
    else this.titulo.alpha = 0

    if (this.fadeAlvo === 1) {
      this.fade.alpha = Math.min(1, this.fade.alpha + dt * this.velocidadeFade)
      if (this.fade.alpha >= 1) {
        this.fadeAlvo = 0
        const meio = this.aoEscurecer
        this.aoEscurecer = null
        if (meio) meio()
      }
    } else this.fade.alpha = Math.max(0, this.fade.alpha - dt * 2.2)
  }

  destruir() {
    this.som.batimento(0)
    this.raiz.destroy({ children: true })
    this.iluminacao.textura.destroy(true)
  }
}
