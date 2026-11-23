import { CanvasTextMetrics, Text, TextStyle } from 'pixi.js'
import { CORES, FONTE } from '../config.js'

export function estilo(opcoes = {}) {
  return new TextStyle({
    fontFamily: FONTE,
    fontSize: 16,
    fill: CORES.texto,
    lineHeight: 14,
    ...opcoes
  })
}

export function texto(conteudo, opcoes = {}) {
  const t = new Text({ text: conteudo, style: estilo(opcoes) })
  t.roundPixels = true
  return t
}

export function quebrarLinhas(conteudo, opcoes, largura) {
  const medida = CanvasTextMetrics.measureText(conteudo, estilo({ ...opcoes, wordWrap: true, wordWrapWidth: largura }))
  return medida.lines.join('\n')
}
