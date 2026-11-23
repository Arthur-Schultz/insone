import { Assets, Rectangle, Texture, TextureSource } from 'pixi.js'
import { ALTURA, LARGURA } from '../config.js'

TextureSource.defaultOptions.scaleMode = 'nearest'

const BASE = import.meta.env.BASE_URL + 'assets/'
const ARQUIVOS = ['iris', 'sombra', 'sombra_olhos', 'coisa', 'coisa_olhos', 'vulto', 'vulto_olhos', 'tiles', 'objetos', 'janela', 'janela_olhos', 'cama', 'retratos']

export const T = {
  PAREDE_SALA: 0,
  PAREDE_QUARTOS: 1,
  TIJOLO: 2,
  MADEIRA_TOPO: 3,
  MADEIRA: 4,
  PEDRA_TOPO: 5,
  PEDRA: 6,
  PRATELEIRA: 7,
  ESPINHOS: 8,
  CAIXA: 9,
  CHAVE: 10,
  PILHA: 11,
  BILHETE: 12,
  CORACAO: 13,
  VELA_APAGADA: 14,
  VELA_ACESA: 15,
  ALAVANCA_OFF: 17,
  ALAVANCA_ON: 18,
  PLACA: 19,
  PLACA_PRESSIONADA: 20,
  PORTAO: 21,
  TECLADO: 22,
  TEIA: 23,
  QUADRO: 24,
  QUADRO_2: 25,
  MARCA: 26
}

export const O = {
  PORTA_CHAVE: 0,
  PORTA_CODIGO: 1,
  PORTA_ABERTA: 2,
  SAIDA: 3,
  RELOGIO: 4
}

export const RETRATO = {
  neutra: 0,
  falando: 1,
  olhos_fechados: 2,
  assustada: 3,
  gritando: 4
}

export const R = {}

function fatiar(textura, largura, altura) {
  const quadros = []
  for (let y = 0; y + altura <= textura.height; y += altura) {
    for (let x = 0; x + largura <= textura.width; x += largura) {
      quadros.push(new Texture({ source: textura.source, frame: new Rectangle(x, y, largura, altura) }))
    }
  }
  return quadros
}

function texturaCanvas(largura, altura, pintar) {
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  const dados = ctx.createImageData(largura, altura)
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const [r, g, b, a] = pintar(x, y)
      const i = (y * largura + x) * 4
      dados.data[i] = r
      dados.data[i + 1] = g
      dados.data[i + 2] = b
      dados.data[i + 3] = a
    }
  }
  ctx.putImageData(dados, 0, 0)
  const textura = Texture.from(canvas)
  textura.source.scaleMode = 'linear'
  return textura
}

function suave(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function criarLuzes() {
  const radial = texturaCanvas(128, 128, (x, y) => {
    const d = Math.hypot(x - 63.5, y - 63.5) / 64
    const v = Math.max(0, 1 - d)
    return [255, 255, 255, Math.round(255 * Math.pow(v, 1.6))]
  })
  const cone = texturaCanvas(160, 128, (x, y) => {
    const dy = y - 64
    const d = Math.hypot(x, dy)
    const angulo = Math.abs(Math.atan2(dy, Math.max(x, 0.001)))
    const queda = Math.max(0, 1 - d / 160)
    const borda = 1 - suave(0.34, 0.52, angulo)
    const v = Math.pow(queda, 1.15) * borda
    return [255, 255, 255, Math.round(255 * Math.min(1, v * 1.1))]
  })
  const vinheta = texturaCanvas(LARGURA / 2, ALTURA / 2, (x, y) => {
    const dx = (x - LARGURA / 4) / (LARGURA / 4)
    const dy = (y - ALTURA / 4) / (ALTURA / 4)
    const d = Math.hypot(dx * 0.9, dy)
    return [0, 0, 0, Math.round(255 * 0.85 * suave(0.55, 1.35, d))]
  })
  const granulado = texturaCanvas(128, 128, () => {
    const v = Math.random() * 255
    return [v, v, v, Math.random() < 0.5 ? 255 : 0]
  })
  granulado.source.scaleMode = 'nearest'
  granulado.source.addressMode = 'repeat'
  return { radial, cone, vinheta, granulado }
}

export async function carregarRecursos() {
  for (const nome of ARQUIVOS) {
    Assets.add({ alias: nome, src: BASE + nome + '.png' })
  }
  const tex = await Assets.load(ARQUIVOS)
  R.iris = fatiar(tex.iris, 16, 24)
  R.sombra = fatiar(tex.sombra, 16, 16)
  R.sombraOlhos = fatiar(tex.sombra_olhos, 16, 16)
  R.coisa = fatiar(tex.coisa, 48, 48)
  R.coisaOlhos = fatiar(tex.coisa_olhos, 48, 48)
  R.tiles = fatiar(tex.tiles, 16, 16)
  R.objetos = fatiar(tex.objetos, 16, 32)
  R.janela = fatiar(tex.janela, 32, 32)
  R.janelaOlhos = tex.janela_olhos
  R.vulto = fatiar(tex.vulto, 20, 14)
  R.vultoOlhos = fatiar(tex.vulto_olhos, 20, 14)
  R.cama = tex.cama
  R.retratos = fatiar(tex.retratos, 32, 32)
  R.luz = criarLuzes()
}
