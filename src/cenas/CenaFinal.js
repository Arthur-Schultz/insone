import { Container, Graphics, Sprite } from 'pixi.js'
import { ALTURA, CORES, LARGURA } from '../config.js'
import { R, RETRATO } from '../core/Recursos.js'
import { lerProgresso, salvarProgresso } from '../core/Progresso.js'
import { texto } from '../ui/Texto.js'

function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export class CenaFinal {
  constructor(jogo, partida) {
    this.jogo = jogo
    this.som = jogo.som
    this.partida = partida
    this.raiz = new Container()
    this.tempo = 0
    this.etapa = 0
    this.relogioEtapa = 0
    const progresso = lerProgresso()
    this.recorde = !progresso.melhorTempo || partida.tempo < progresso.melhorTempo
    if (this.recorde) salvarProgresso({ melhorTempo: partida.tempo })
    this.som.definirModo('final')
    this.som.batimento(0)

    this.camada = new Container()
    this.raiz.addChild(new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0x000000), this.camada)
    this.etapas = [
      { duracao: 4, montar: () => this.frase('Iris deitou na cama e fechou os olhos.') },
      { duracao: 4.5, montar: () => this.frase('Pela primeira vez em muitas noites,\no escuro ficou quieto.') },
      { duracao: 6, montar: () => this.estatisticas() },
      { duracao: 9, montar: () => this.creditos() },
      { duracao: Infinity, montar: () => this.fim() }
    ]
    this.etapas[0].montar()
  }

  frase(conteudo) {
    this.camada.removeChildren()
    const t = texto(conteudo, { fill: CORES.texto, fontSize: 22, align: 'center' })
    t.anchor.set(0.5)
    t.position.set(LARGURA / 2, ALTURA / 2)
    this.camada.addChild(t)
  }

  estatisticas() {
    this.camada.removeChildren()
    const p = this.partida
    const linhas = [
      `Tempo total: ${formatarTempo(p.tempo)}${this.recorde ? '   (novo recorde!)' : ''}`,
      `Vezes que o escuro venceu: ${p.mortes}`,
      `Bilhetes lidos: ${p.bilhetes} de 9`,
      `Sombras dissolvidas: ${p.sombras}`
    ]
    const cab = texto('A NOITE DE IRIS', { fill: CORES.destaque, fontSize: 28 })
    cab.anchor.set(0.5)
    cab.position.set(LARGURA / 2, 70)
    const corpo = texto(linhas.join('\n'), { fill: CORES.texto, fontSize: 18, lineHeight: 22, align: 'center' })
    corpo.anchor.set(0.5, 0)
    corpo.position.set(LARGURA / 2, 105)
    this.camada.addChild(cab, corpo)
  }

  creditos() {
    this.camada.removeChildren()
    const linhas = [
      'INSONE',
      '',
      'Um jogo do Grupo 20',
      '',
      'Arthur Schultz Marzaro',
      'Augusto Brando Almeida',
      'Eduardo de Oliveira Ferreira Filho',
      'Pedro Lucas de Souza Caniato',
      '',
      'Desenvolvimento de Jogos Digitais — UniAcademia',
      'Prof. Msc. Christien Lana Rachid',
      '',
      'Feito com PixiJS v8',
      'Trilha e efeitos sonoros gerados com Web Audio API'
    ]
    this.rolagem = texto(linhas.join('\n'), { fill: CORES.texto, fontSize: 18, lineHeight: 20, align: 'center' })
    this.rolagem.anchor.set(0.5, 0)
    this.rolagem.position.set(LARGURA / 2, ALTURA + 10)
    this.camada.addChild(this.rolagem)
  }

  fim() {
    this.camada.removeChildren()
    this.rolagem = null
    const relogio = texto('03:34', { fill: 0xff3c50, fontSize: 40 })
    relogio.anchor.set(0.5)
    relogio.position.set(LARGURA / 2, 60)
    this.retrato = new Sprite(R.retratos[RETRATO.olhos_fechados])
    this.retrato.scale.set(3)
    this.retrato.anchor.set(0.5)
    this.retrato.position.set(LARGURA / 2, 135)
    const fim = texto('FIM', { fill: CORES.texto, fontSize: 32 })
    fim.anchor.set(0.5)
    fim.position.set(LARGURA / 2, 205)
    this.voltar = texto('obrigado por jogar • ENTER para voltar ao menu', { fill: 0x6a6280, fontSize: 14 })
    this.voltar.anchor.set(0.5)
    this.voltar.position.set(LARGURA / 2, 240)
    this.camada.addChild(relogio, this.retrato, fim, this.voltar)
  }

  atualizar(dt, entrada) {
    this.tempo += dt
    this.relogioEtapa += dt
    const etapa = this.etapas[this.etapa]
    const ultima = this.etapa === this.etapas.length - 1
    this.camada.alpha = ultima ? Math.min(1, this.relogioEtapa) : Math.min(1, this.relogioEtapa, (etapa.duracao - this.relogioEtapa) * 1.5)
    if (this.rolagem) this.rolagem.y = ALTURA + 10 - this.relogioEtapa * 52
    if (this.voltar) this.voltar.alpha = 0.5 + Math.sin(this.tempo * 3) * 0.5
    const pular = entrada.apertou('confirmar') || entrada.apertou('voltar')
    if (ultima) {
      if (pular && this.relogioEtapa > 1) {
        this.som.confirmarMenu()
        this.jogo.irParaTitulo()
      }
      return
    }
    if (this.relogioEtapa >= etapa.duracao || pular) {
      this.etapa = pular ? this.etapas.length - 1 : this.etapa + 1
      this.relogioEtapa = 0
      this.etapas[this.etapa].montar()
    }
  }

  destruir() {
    this.raiz.destroy({ children: true })
  }
}
