import { Container, Sprite, TilingSprite } from 'pixi.js'
import { TILE } from '../config.js'
import { A, O, R, T } from '../core/Recursos.js'

const TEMAS = {
  sala: { parede: T.PAREDE_SALA, topo: T.MADEIRA_TOPO, interior: T.MADEIRA },
  porao: { parede: T.TIJOLO, topo: T.PEDRA_TOPO, interior: T.PEDRA },
  quartos: { parede: T.PAREDE_QUARTOS, topo: T.MADEIRA_TOPO, interior: T.MADEIRA },
  biblioteca: { parede: T.PAREDE_QUARTOS, topo: T.MADEIRA_TOPO, interior: T.MADEIRA },
  musica: { parede: T.PAREDE_SALA, topo: T.PEDRA_TOPO, interior: T.PEDRA }
}

export class Fase {
  constructor(dados) {
    this.mapa = dados.mapa
    this.altura = this.mapa.length
    this.largura = this.mapa[0].length
    this.larguraPx = this.largura * TILE
    this.alturaPx = this.altura * TILE
    this.tema = TEMAS[dados.tema]
  }

  char(tx, ty) {
    if (tx < 0 || tx >= this.largura) return '#'
    if (ty < 0) return '#'
    if (ty >= this.altura) return '.'
    return this.mapa[ty][tx]
  }

  solido(tx, ty) {
    return this.char(tx, ty) === '#'
  }

  plataforma(tx, ty) {
    const c = this.char(tx, ty)
    return c === '=' || c === ':'
  }

  chaoEm(px, py) {
    const tx = Math.floor(px / TILE)
    const ty = Math.floor(py / TILE)
    return this.solido(tx, ty) || this.plataforma(tx, ty)
  }

  percorrer(callback) {
    for (let ty = 0; ty < this.altura; ty++) {
      for (let tx = 0; tx < this.largura; tx++) callback(this.mapa[ty][tx], tx, ty)
    }
  }

  criarCenario() {
    const fundo = new Container()
    const parede = new TilingSprite({ texture: R.tiles[this.tema.parede], width: this.larguraPx, height: this.alturaPx })
    fundo.addChild(parede)
    const tiles = new Container()
    this.percorrer((c, tx, ty) => {
      const x = tx * TILE
      const y = ty * TILE
      let textura = null
      if (c === '#') textura = this.char(tx, ty - 1) === '#' ? R.tiles[this.tema.interior] : R.tiles[this.tema.topo]
      if (c === '=') textura = R.tiles[T.PRATELEIRA]
      if (c === '^') textura = R.tiles[T.ESPINHOS]
      if (textura) {
        const s = new Sprite(textura)
        s.position.set(x, y)
        tiles.addChild(s)
      }
      let decor = null
      if (c === 'p') decor = new Sprite(R.tiles[T.QUADRO])
      if (c === 'q') decor = new Sprite(R.tiles[T.QUADRO_2])
      if (c === 'x') decor = new Sprite(R.tiles[T.TEIA])
      if (c === 'e') {
        decor = new Sprite(R.altos[A.ESTANTE])
        decor.position.set(x, y - TILE)
      }
      if (c === 'r') {
        decor = new Sprite(R.altos[A.CORTINA])
        decor.position.set(x, y)
      }
      if (c === 'k') {
        decor = new Sprite(R.objetos[O.RELOGIO])
        decor.position.set(x, y - TILE)
      }
      if (c === 'b') {
        decor = new Sprite(R.cama)
        decor.position.set(x - 8, y)
      }
      if (decor) {
        if (decor.x === 0 && decor.y === 0) decor.position.set(x, y)
        fundo.addChild(decor)
      }
    })
    fundo.addChild(tiles)
    return fundo
  }
}
