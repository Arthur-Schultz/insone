import { Sprite, TilingSprite } from 'pixi.js'
import { FISICA, LANTERNA, TILE } from '../config.js'
import { A, O, R, T, X } from '../core/Recursos.js'
import { mover, sobrepoe } from './Fisica.js'

export class Caixa {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE + 1
    this.y = ty * TILE
    this.w = TILE - 2
    this.h = TILE
    this.vy = 0
    this.sprite = new Sprite(R.tiles[T.CAIXA])
  }

  empurrar(dx) {
    const outros = this.cena.solidos().filter((s) => s !== this)
    mover(this, dx, 0, this.cena.fase, outros)
    if (Math.random() < 0.08) this.cena.particulas.poeira(this.x + (dx > 0 ? 0 : this.w), this.y + this.h, 1)
  }

  atualizar(dt) {
    this.vy = Math.min(FISICA.quedaMaxima, this.vy + FISICA.gravidade * dt)
    const outros = this.cena.solidos().filter((s) => s !== this)
    const r = mover(this, 0, this.vy * dt, this.cena.fase, outros)
    if (r.y) this.vy = 0
    this.sprite.position.set(Math.round(this.x) - 1, Math.round(this.y))
  }
}

export class Porta {
  constructor(cena, tx, ty, tipo) {
    this.cena = cena
    this.tipo = tipo
    this.x = tx * TILE
    this.y = (ty - 1) * TILE
    this.w = TILE
    this.h = TILE * 2
    this.aberta = false
    this.sprite = new Sprite(R.objetos[tipo === 'chave' ? O.PORTA_CHAVE : O.PORTA_CODIGO])
    this.sprite.position.set(this.x, this.y)
    this.rotulo = tipo === 'chave' ? 'abrir' : 'examinar'
  }

  get bloqueia() {
    return !this.aberta
  }

  interagir() {
    if (this.aberta) return
    if (this.tipo === 'chave') {
      if (this.cena.estado.temChave) {
        this.cena.estado.temChave = false
        this.abrir()
        this.cena.aviso('A chave serviu.')
      } else {
        this.cena.som.trancada()
        this.cena.aviso('Trancada. Preciso de uma chave.')
      }
    } else {
      this.cena.som.trancada()
      this.cena.aviso('Um cadeado de código. O painel fica ao lado.')
    }
  }

  abrir() {
    this.aberta = true
    this.sprite.texture = R.objetos[O.PORTA_ABERTA]
    this.cena.som.porta()
    this.cena.tremer(2, 0.3)
  }
}

export class Portao {
  constructor(cena, tx, topo, base, grupo) {
    this.cena = cena
    this.grupo = grupo
    this.x = tx * TILE + 2
    this.y = topo * TILE
    this.w = TILE - 4
    this.alturaTotal = (base - topo + 1) * TILE
    this.abertura = 0
    this.alvo = 0
    this.sprite = new TilingSprite({ texture: R.tiles[T.PORTAO], width: TILE, height: this.alturaTotal })
    this.sprite.position.set(tx * TILE, this.y)
  }

  get h() {
    return Math.max(0, this.alturaTotal * (1 - this.abertura))
  }

  get bloqueia() {
    return this.h > 2
  }

  atualizar(dt) {
    if (this.abertura === this.alvo) return
    const anterior = this.abertura
    const passo = dt * (this.abertura < this.alvo ? 1.4 : 2.6)
    if (this.abertura < this.alvo) this.abertura = Math.min(this.alvo, this.abertura + passo)
    else {
      this.abertura = Math.max(this.alvo, this.abertura - passo)
      const corpos = [this.cena.iris, ...this.cena.caixas]
      if (corpos.some((c) => sobrepoe(c, this))) this.abertura = anterior
    }
    this.sprite.height = Math.max(1, this.h)
    this.sprite.visible = this.h > 1
  }

  definir(aberto) {
    const alvo = aberto ? 1 : 0
    if (alvo !== this.alvo) {
      this.alvo = alvo
      this.cena.som.portao()
    }
  }
}

export class Alavanca {
  constructor(cena, tx, ty, grupo = 'alavanca', tempo = 0) {
    this.cena = cena
    this.grupo = grupo
    this.tempo = tempo
    this.restante = 0
    this.relogioTique = 0
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.ligada = false
    this.rotulo = 'puxar'
    this.texturaDesligada = R.tiles[T.ALAVANCA_OFF]
    this.sprite = new Sprite(R.tiles[T.ALAVANCA_OFF])
    this.sprite.position.set(this.x, this.y)
    if (grupo === 'tempo') this.sprite.tint = 0xffb0b0
  }

  definir(ligada) {
    this.ligada = ligada
    this.sprite.texture = R.tiles[ligada ? T.ALAVANCA_ON : T.ALAVANCA_OFF]
  }

  interagir() {
    if (this.grupo === 'tempo') {
      this.definir(true)
      this.restante = this.tempo
      this.cena.som.alavanca()
      this.cena.portoes.filter((p) => p.grupo === 'tempo').forEach((p) => p.definir(true))
      this.cena.aviso(`O portão vai fechar em ${this.tempo} segundos!`)
      return
    }
    this.definir(!this.ligada)
    this.cena.som.alavanca()
    this.cena.verificarAlavancas()
  }

  atualizar(dt) {
    if (this.restante <= 0) return
    this.restante -= dt
    this.relogioTique -= dt
    if (this.relogioTique <= 0) {
      this.relogioTique = this.restante < 2 ? 0.2 : 0.5
      this.cena.som.bip()
    }
    if (this.restante <= 0) {
      this.definir(false)
      this.cena.portoes.filter((p) => p.grupo === 'tempo').forEach((p) => p.definir(false))
    }
  }
}

export class Placa {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE + 10
    this.w = TILE
    this.h = 6
    this.pressionada = false
    this.sprite = new Sprite(R.tiles[T.PLACA])
    this.sprite.position.set(tx * TILE, ty * TILE)
  }

  atualizar() {
    const area = { x: this.x + 2, y: this.y - 2, w: this.w - 4, h: this.h + 2 }
    const corpos = [this.cena.iris, ...this.cena.caixas]
    const agora = corpos.some((c) => sobrepoe(c, area))
    if (agora !== this.pressionada) {
      this.pressionada = agora
      this.sprite.texture = R.tiles[agora ? T.PLACA_PRESSIONADA : T.PLACA]
      this.cena.som.placa()
    }
  }
}

export class Item {
  constructor(cena, tx, ty, tipo) {
    this.cena = cena
    this.tipo = tipo
    this.x = tx * TILE + 3
    this.y = ty * TILE + 3
    this.w = 10
    this.h = 12
    this.coletado = false
    this.tempo = Math.random() * 6
    this.sprite = new Sprite(tipo === 'uv' ? R.extras[X.LANTERNA_UV] : R.tiles[{ chave: T.CHAVE, pilha: T.PILHA, coracao: T.CORACAO }[tipo]])
    this.sprite.anchor.set(0.5)
    this.baseX = tx * TILE + 8
    this.baseY = ty * TILE + 8
  }

  atualizar(dt) {
    if (this.coletado) return
    this.tempo += dt
    this.sprite.position.set(this.baseX, Math.round(this.baseY + Math.sin(this.tempo * 3) * 1.5))
    const iris = this.cena.iris
    if (!sobrepoe(iris, this)) return
    if (this.tipo === 'coracao' && iris.sanidade >= iris.sanidadeMaxima) return
    this.coletado = true
    this.sprite.visible = false
    this.cena.particulas.brilho(this.baseX, this.baseY)
    if (this.tipo === 'chave') {
      this.cena.estado.temChave = true
      this.cena.som.chave()
      this.cena.aviso('Você pegou a chave do corredor!')
    } else if (this.tipo === 'pilha') {
      iris.recarregar(LANTERNA.recarga)
      this.cena.som.pegar()
      this.cena.aviso('Pilhas novas para a lanterna.')
    } else if (this.tipo === 'uv') {
      this.cena.estado.temUV = true
      iris.recarregar(100)
      this.cena.som.chave()
      this.cena.pegouUV()
    } else {
      iris.sanidade++
      this.cena.som.pegar()
      this.cena.aviso('Você respira fundo. Sanidade +1')
    }
  }
}

export class Bilhete {
  constructor(cena, tx, ty, indice) {
    this.cena = cena
    this.indice = indice
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.rotulo = 'ler'
    this.lido = false
    this.sprite = new Sprite(R.tiles[T.BILHETE])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    this.cena.som.papel()
    this.lido = true
    this.cena.lerBilhete(this.indice)
  }
}

export class Marca {
  constructor(cena, tx, ty, indice) {
    this.cena = cena
    this.indice = indice
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.rotulo = 'examinar'
    this.sprite = new Sprite(R.tiles[T.MARCA])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    this.cena.som.papel()
    this.cena.examinarMarca(this.indice)
  }
}

export class Vela {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.acesa = false
    this.tempo = Math.random() * 4
    this.sprite = new Sprite(R.tiles[T.VELA_APAGADA])
    this.sprite.position.set(this.x, this.y)
  }

  atualizar(dt) {
    this.tempo += dt
    if (this.acesa) {
      this.sprite.texture = R.tiles[T.VELA_ACESA + (Math.floor(this.tempo * 5) % 2)]
      return
    }
    if (sobrepoe(this.cena.iris, this)) {
      this.acesa = true
      this.cena.definirCheckpoint(this.x, this.y)
      this.cena.som.vela()
      this.cena.particulas.brilho(this.x + 8, this.y + 5)
      this.cena.aviso('A vela acendeu. Você vai voltar aqui se algo der errado.')
    }
  }
}

export class Teclado {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE - 4
    this.w = TILE
    this.h = TILE
    this.rotulo = 'digitar código'
    this.sprite = new Sprite(R.tiles[T.TECLADO])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    if (this.cena.portas.some((p) => p.tipo === 'codigo' && p.aberta)) {
      this.cena.aviso('O cadeado já está aberto.')
      return
    }
    this.cena.abrirPainelCodigo()
  }
}

export class Saida {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE + 3
    this.y = (ty - 1) * TILE
    this.w = TILE - 6
    this.h = TILE * 2
    this.sprite = new Sprite(R.objetos[O.SAIDA])
    this.sprite.position.set(tx * TILE, this.y)
  }
}

export class Janela {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE
    this.olhos = 0
    this.relogio = 3 + Math.random() * 6
    this.sprite = new Sprite(R.janela[0])
    this.sprite.position.set(this.x, this.y)
    this.brilho = new Sprite(R.janelaOlhos)
    this.brilho.position.set(this.x, this.y)
    this.brilho.visible = false
  }

  get centroX() {
    return this.x + 16
  }

  mostrarOlhos(tempo) {
    this.olhos = tempo
  }

  atualizar(dt) {
    const iris = this.cena.iris
    const distancia = Math.abs(iris.centroX - this.centroX)
    this.relogio -= dt
    if (this.relogio <= 0) {
      this.relogio = 7 + Math.random() * 9
      if (distancia < 230 && distancia > 50) {
        this.olhos = 0.7 + Math.random() * 0.8
        this.cena.som.sussurro()
      }
    }
    if (this.olhos > 0 && distancia < 36) this.olhos = Math.min(this.olhos, 0.06)
    if (this.olhos > 0) this.olhos -= dt
    const visivel = this.olhos > 0
    this.sprite.texture = R.janela[visivel ? 1 : 0]
    this.brilho.visible = visivel && Math.random() > 0.04
    this.brilho.x = this.x + (visivel && Math.random() < 0.1 ? Math.round(Math.random() * 2 - 1) : 0)
  }
}

export class Revelavel {
  constructor(cena, tx, ty, textura, opcoes = {}) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.revelado = 0
    this.visto = false
    this.sprite = new Sprite(textura)
    this.sprite.position.set(this.x, this.y)
    this.sprite.alpha = 0
    this.minimo = opcoes.minimo ?? 0
  }

  atualizar(dt) {
    const uv = this.cena.luzUV(this.x + 8, this.y + 8)
    this.revelado = Math.max(0, Math.min(1, this.revelado + (uv ? dt * 4 : -dt * 1.2)))
    if (this.revelado > 0.5) this.visto = true
    this.sprite.alpha = Math.max(this.minimo, this.revelado) * (0.85 + Math.random() * 0.15 * this.revelado)
  }
}

export class EscritaUV extends Revelavel {
  constructor(cena, tx, ty, indice, simbolo) {
    const texturas = { seta: X.ESCRITA_SETA, olho: X.ESCRITA_OLHO, x: X.ESCRITA_X }
    super(cena, tx, ty, R.extras[texturas[simbolo] ?? X.ESCRITA_OLHO])
    this.indice = indice
    this.rotulo = 'ler'
  }

  get interativo() {
    return this.revelado > 0.3
  }

  interagir() {
    this.cena.som.sussurro()
    this.cena.lerEscrita(this.indice)
  }
}

export class Espelho {
  constructor(cena, tx, ty, inicial) {
    this.cena = cena
    this.tx = tx
    this.ty = ty
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.barra = inicial || '/'
    this.rotulo = 'girar espelho'
    this.sprite = new Sprite(R.extras[this.barra === '/' ? X.ESPELHO_BARRA : X.ESPELHO_CONTRA])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    this.barra = this.barra === '/' ? '\\' : '/'
    this.sprite.texture = R.extras[this.barra === '/' ? X.ESPELHO_BARRA : X.ESPELHO_CONTRA]
    this.cena.som.alavanca()
  }
}

export class Projetor {
  constructor(cena, tx, ty, direcao) {
    this.tx = tx
    this.ty = ty
    this.x = tx * TILE
    this.y = ty * TILE
    this.direcao = direcao || '>'
    this.sprite = new Sprite(R.extras[X.PROJETOR])
    this.sprite.anchor.set(0.5)
    this.sprite.position.set(this.x + 8, this.y + 8)
    this.sprite.rotation = { '>': 0, 'v': Math.PI / 2, '<': Math.PI, '^': -Math.PI / 2 }[this.direcao]
  }
}

export class Sensor {
  constructor(cena, tx, ty) {
    this.tx = tx
    this.ty = ty
    this.x = tx * TILE
    this.y = ty * TILE
    this.ativo = false
    this.sprite = new Sprite(R.extras[X.SENSOR])
    this.sprite.position.set(this.x, this.y)
  }

  definir(ativo) {
    this.ativo = ativo
    this.sprite.texture = R.extras[ativo ? X.SENSOR_ATIVO : X.SENSOR]
  }
}

export class Tecla {
  constructor(cena, tx, ty, indice) {
    this.cena = cena
    this.indice = indice
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.brilho = 0
    this.rotulo = 'tocar'
    this.sprite = new Sprite(R.extras[X.TECLA + indice])
    this.sprite.position.set(this.x, this.y)
  }

  acender(tempo = 0.35) {
    this.brilho = tempo
  }

  interagir() {
    this.acender()
    this.cena.som.nota(this.indice)
    this.cena.tocarTecla(this.indice)
  }

  atualizar(dt) {
    if (this.brilho > 0) this.brilho -= dt
    this.sprite.texture = R.extras[(this.brilho > 0 ? X.TECLA_ACESA : X.TECLA) + this.indice]
  }
}

export class Caixinha {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = ty * TILE
    this.w = TILE
    this.h = TILE
    this.rotulo = 'abrir caixinha'
    this.sprite = new Sprite(R.extras[X.CAIXINHA])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    this.sprite.texture = R.extras[X.CAIXINHA_ABERTA]
    this.cena.tocarMelodia()
  }
}

export class Lampada {
  constructor(cena, tx, ty) {
    this.cena = cena
    this.x = tx * TILE
    this.y = (ty - 1) * TILE
    this.w = TILE
    this.h = TILE * 2
    this.acesa = false
    this.rotulo = 'acender'
    this.sprite = new Sprite(R.altos[A.LAMPADA])
    this.sprite.position.set(this.x, this.y)
  }

  interagir() {
    if (this.acesa) return
    if (!this.cena.chefe) {
      this.cena.aviso('Não tem energia... ainda.')
      return
    }
    this.acesa = true
    this.sprite.texture = R.altos[A.LAMPADA_ACESA]
    this.cena.som.vela()
    this.cena.acendeuLampada()
  }
}
