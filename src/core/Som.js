const NOTAS = { D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A4: 440, E4: 329.63, C5: 523.25 }

const CANCAO = ['A5', 'C6', 'E6', 'A5', 'G5', 'E5', 'D5', 'E5', 'A5', 'C6', 'E6', 'G6', 'F6', 'E6', 'D6', null, 'E6', 'D6', 'C6', 'A5', 'G5', 'A5', 'B5', 'C6', 'A5', null, 'E5', null, 'A4', null, null, null]

export class Som {
  constructor() {
    this.ctx = null
    this.mudo = false
    this.modo = 'silencio'
    this.passoCancao = 0
    this.relogioCancao = 0
    this.relogioRangido = 4
    this.relogioPiano = 3
    this.relogioBatimento = 0
    this.intensidadeBatimento = 0
    this.relogioPulso = 0
    try {
      this.mudo = localStorage.getItem('insone-mudo') === '1'
    } catch {
      this.mudo = false
    }
  }

  iniciar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Contexto = window.AudioContext || window.webkitAudioContext
    if (!Contexto) return
    this.ctx = new Contexto()
    this.mestre = this.ctx.createGain()
    this.mestre.gain.value = this.mudo ? 0 : 0.55
    this.mestre.connect(this.ctx.destination)
    this.efeitos = this.ctx.createGain()
    this.efeitos.gain.value = 0.9
    this.efeitos.connect(this.mestre)
    this.musica = this.ctx.createGain()
    this.musica.gain.value = 0.5
    this.musica.connect(this.mestre)
    this.reverb = this.ctx.createConvolver()
    this.reverb.buffer = this.criarImpulso(2.8)
    this.reverbVolume = this.ctx.createGain()
    this.reverbVolume.gain.value = 0.6
    this.reverb.connect(this.reverbVolume)
    this.reverbVolume.connect(this.mestre)
    this.ruidoBuffer = this.criarRuido()
    this.iniciarDrone()
  }

  criarImpulso(segundos) {
    const taxa = this.ctx.sampleRate
    const buffer = this.ctx.createBuffer(2, taxa * segundos, taxa)
    for (let c = 0; c < 2; c++) {
      const dados = buffer.getChannelData(c)
      for (let i = 0; i < dados.length; i++) {
        dados[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dados.length, 2.5)
      }
    }
    return buffer
  }

  criarRuido() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate)
    const dados = buffer.getChannelData(0)
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1
    return buffer
  }

  iniciarDrone() {
    const ctx = this.ctx
    this.droneVolume = ctx.createGain()
    this.droneVolume.gain.value = 0
    const filtro = ctx.createBiquadFilter()
    filtro.type = 'lowpass'
    filtro.frequency.value = 160
    filtro.Q.value = 6
    const lfo = ctx.createOscillator()
    const lfoGanho = ctx.createGain()
    lfo.frequency.value = 0.07
    lfoGanho.gain.value = 70
    lfo.connect(lfoGanho)
    lfoGanho.connect(filtro.frequency)
    lfo.start()
    for (const f of [55, 55.7, 82.4]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = f
      osc.connect(filtro)
      osc.start()
    }
    filtro.connect(this.droneVolume)
    this.droneVolume.connect(this.musica)
  }

  alternarMudo() {
    this.mudo = !this.mudo
    try {
      localStorage.setItem('insone-mudo', this.mudo ? '1' : '0')
    } catch {}
    if (this.mestre) this.mestre.gain.setTargetAtTime(this.mudo ? 0 : 0.55, this.ctx.currentTime, 0.05)
    return this.mudo
  }

  definirModo(modo) {
    this.modo = modo
    if (!this.ctx) return
    const alvo = { titulo: 0.05, jogo: 0.14, perseguicao: 0.22, final: 0.04, silencio: 0 }[modo] ?? 0
    this.droneVolume.gain.setTargetAtTime(alvo, this.ctx.currentTime, 1.2)
  }

  tom({ freq, freqFinal, tipo = 'square', duracao = 0.1, volume = 0.2, ataque = 0.005, atraso = 0, reverb = 0, destino }) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + atraso
    const osc = this.ctx.createOscillator()
    const ganho = this.ctx.createGain()
    osc.type = tipo
    osc.frequency.setValueAtTime(freq, t)
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqFinal), t + duracao)
    ganho.gain.setValueAtTime(0.0001, t)
    ganho.gain.exponentialRampToValueAtTime(volume, t + ataque)
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao)
    osc.connect(ganho)
    ganho.connect(destino || this.efeitos)
    if (reverb) {
      const envio = this.ctx.createGain()
      envio.gain.value = reverb
      ganho.connect(envio)
      envio.connect(this.reverb)
    }
    osc.start(t)
    osc.stop(t + duracao + 0.05)
  }

  ruido({ duracao = 0.1, volume = 0.2, tipoFiltro = 'lowpass', freq = 1200, freqFinal, q = 1, atraso = 0, reverb = 0, ataque = 0.003 }) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + atraso
    const fonte = this.ctx.createBufferSource()
    fonte.buffer = this.ruidoBuffer
    const filtro = this.ctx.createBiquadFilter()
    filtro.type = tipoFiltro
    filtro.frequency.setValueAtTime(freq, t)
    if (freqFinal) filtro.frequency.exponentialRampToValueAtTime(freqFinal, t + duracao)
    filtro.Q.value = q
    const ganho = this.ctx.createGain()
    ganho.gain.setValueAtTime(0.0001, t)
    ganho.gain.exponentialRampToValueAtTime(volume, t + ataque)
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao)
    fonte.connect(filtro)
    filtro.connect(ganho)
    ganho.connect(this.efeitos)
    if (reverb) {
      const envio = this.ctx.createGain()
      envio.gain.value = reverb
      ganho.connect(envio)
      envio.connect(this.reverb)
    }
    fonte.start(t, Math.random() * 1.5)
    fonte.stop(t + duracao + 0.05)
  }

  caixinha(nota, volume = 0.07, atraso = 0) {
    const freq = NOTAS[nota]
    if (!freq) return
    this.tom({ freq, tipo: 'triangle', duracao: 1.4, volume, atraso, reverb: 0.8, destino: this.musica })
    this.tom({ freq: freq * 2.01, tipo: 'sine', duracao: 0.6, volume: volume * 0.3, atraso, reverb: 0.8, destino: this.musica })
  }

  passo() {
    this.ruido({ duracao: 0.06, volume: 0.07, freq: 500 + Math.random() * 300, tipoFiltro: 'bandpass', q: 2 })
  }

  pulo() {
    this.tom({ freq: 220, freqFinal: 420, tipo: 'square', duracao: 0.12, volume: 0.05 })
  }

  pouso() {
    this.ruido({ duracao: 0.1, volume: 0.1, freq: 300, tipoFiltro: 'lowpass' })
  }

  lanterna(ligada) {
    this.tom({ freq: ligada ? 1800 : 1200, tipo: 'square', duracao: 0.03, volume: 0.05 })
    this.ruido({ duracao: 0.03, volume: 0.06, freq: 3000, tipoFiltro: 'highpass' })
  }

  pilhaFraca() {
    this.tom({ freq: 880, tipo: 'square', duracao: 0.08, volume: 0.04 })
    this.tom({ freq: 660, tipo: 'square', duracao: 0.08, volume: 0.04, atraso: 0.12 })
  }

  pegar() {
    this.tom({ freq: 660, tipo: 'square', duracao: 0.08, volume: 0.06 })
    this.tom({ freq: 990, tipo: 'square', duracao: 0.12, volume: 0.06, atraso: 0.07 })
  }

  chave() {
    ;[880, 1108, 1318, 1760].forEach((f, i) => this.tom({ freq: f, tipo: 'triangle', duracao: 0.4, volume: 0.07, atraso: i * 0.07, reverb: 0.5 }))
  }

  porta() {
    this.ruido({ duracao: 0.9, volume: 0.18, freq: 200, freqFinal: 900, tipoFiltro: 'bandpass', q: 8, reverb: 0.3 })
    this.tom({ freq: 90, freqFinal: 70, tipo: 'sawtooth', duracao: 0.5, volume: 0.06 })
  }

  trancada() {
    this.ruido({ duracao: 0.08, volume: 0.15, freq: 800, tipoFiltro: 'bandpass', q: 4 })
    this.ruido({ duracao: 0.08, volume: 0.12, freq: 700, tipoFiltro: 'bandpass', q: 4, atraso: 0.1 })
  }

  alavanca() {
    this.ruido({ duracao: 0.05, volume: 0.2, freq: 2000, tipoFiltro: 'bandpass', q: 3 })
    this.tom({ freq: 120, freqFinal: 60, tipo: 'square', duracao: 0.15, volume: 0.08 })
  }

  portao() {
    this.ruido({ duracao: 1.2, volume: 0.12, freq: 400, freqFinal: 150, tipoFiltro: 'bandpass', q: 12, reverb: 0.4 })
  }

  placa() {
    this.tom({ freq: 300, freqFinal: 200, tipo: 'square', duracao: 0.08, volume: 0.06 })
  }

  papel() {
    this.ruido({ duracao: 0.25, volume: 0.08, freq: 4000, tipoFiltro: 'highpass' })
  }

  vela() {
    this.ruido({ duracao: 0.4, volume: 0.12, freq: 900, freqFinal: 2500, tipoFiltro: 'bandpass', q: 1 })
    this.tom({ freq: 523, tipo: 'sine', duracao: 1.2, volume: 0.05, reverb: 0.7, atraso: 0.1 })
    this.tom({ freq: 784, tipo: 'sine', duracao: 1.2, volume: 0.04, reverb: 0.7, atraso: 0.25 })
  }

  dano() {
    this.tom({ freq: 300, freqFinal: 60, tipo: 'sawtooth', duracao: 0.35, volume: 0.15 })
    this.ruido({ duracao: 0.25, volume: 0.15, freq: 1500, freqFinal: 200 })
  }

  susto() {
    ;[311, 330, 466, 494, 622].forEach((f) => this.tom({ freq: f, freqFinal: f * 0.97, tipo: 'sawtooth', duracao: 1.4, volume: 0.05, ataque: 0.02, reverb: 0.6 }))
    this.ruido({ duracao: 0.8, volume: 0.15, freq: 3000, freqFinal: 400, reverb: 0.5 })
  }

  sombraMorre() {
    this.ruido({ duracao: 0.6, volume: 0.15, freq: 200, freqFinal: 3000, tipoFiltro: 'bandpass', q: 3, ataque: 0.4 })
    this.tom({ freq: 80, freqFinal: 400, tipo: 'sine', duracao: 0.6, volume: 0.08 })
  }

  vultoGrito() {
    this.tom({ freq: 1700, freqFinal: 2600, tipo: 'sawtooth', duracao: 0.25, volume: 0.06 })
    this.tom({ freq: 1760, freqFinal: 2300, tipo: 'square', duracao: 0.3, volume: 0.04, atraso: 0.05 })
  }

  asa() {
    this.ruido({ duracao: 0.07, volume: 0.05, freq: 700, tipoFiltro: 'bandpass', q: 1.5 })
  }

  sussurro() {
    this.ruido({ duracao: 1.6, volume: 0.07, freq: 1800, freqFinal: 3200, tipoFiltro: 'bandpass', q: 9, ataque: 0.5, reverb: 0.8 })
    this.ruido({ duracao: 1.2, volume: 0.05, freq: 2600, freqFinal: 1400, tipoFiltro: 'bandpass', q: 12, ataque: 0.4, atraso: 0.3, reverb: 0.8 })
    this.tom({ freq: 622, freqFinal: 587, tipo: 'sine', duracao: 1.6, volume: 0.03, ataque: 0.3, reverb: 0.8 })
  }

  sombraChiado() {
    this.ruido({ duracao: 0.3, volume: 0.05, freq: 2500, tipoFiltro: 'bandpass', q: 6 })
  }

  bip() {
    this.tom({ freq: 1200, tipo: 'square', duracao: 0.05, volume: 0.05 })
  }

  correto() {
    ;[523, 659, 784, 1046].forEach((f, i) => this.tom({ freq: f, tipo: 'square', duracao: 0.15, volume: 0.05, atraso: i * 0.08 }))
  }

  errado() {
    this.tom({ freq: 140, tipo: 'sawtooth', duracao: 0.4, volume: 0.1 })
    this.tom({ freq: 147, tipo: 'sawtooth', duracao: 0.4, volume: 0.1 })
  }

  letra() {
    this.tom({ freq: 520 + Math.random() * 60, tipo: 'square', duracao: 0.025, volume: 0.025 })
  }

  menu() {
    this.tom({ freq: 600, tipo: 'square', duracao: 0.04, volume: 0.04 })
  }

  confirmarMenu() {
    this.tom({ freq: 500, freqFinal: 900, tipo: 'square', duracao: 0.1, volume: 0.05 })
  }

  morte() {
    ;[220, 207, 196, 174].forEach((f, i) => this.tom({ freq: f, tipo: 'triangle', duracao: 0.9, volume: 0.08, atraso: i * 0.35, reverb: 0.7 }))
    this.ruido({ duracao: 2, volume: 0.1, freq: 600, freqFinal: 80, reverb: 0.5 })
  }

  rugido() {
    this.tom({ freq: 70, freqFinal: 40, tipo: 'sawtooth', duracao: 2, volume: 0.2, ataque: 0.2, reverb: 0.5 })
    this.ruido({ duracao: 2, volume: 0.2, freq: 400, freqFinal: 100, ataque: 0.3, reverb: 0.5 })
  }

  batimento(intensidade) {
    this.intensidadeBatimento = intensidade
  }

  atualizar(dt) {
    if (!this.ctx) return
    if (this.modo === 'titulo' || this.modo === 'final') {
      this.relogioCancao -= dt
      if (this.relogioCancao <= 0) {
        this.relogioCancao = 0.42
        const nota = CANCAO[this.passoCancao % CANCAO.length]
        if (nota) this.caixinha(nota, this.modo === 'final' ? 0.05 : 0.06)
        this.passoCancao++
      }
    }
    if (this.modo === 'jogo' || this.modo === 'perseguicao') {
      this.relogioRangido -= dt
      if (this.relogioRangido <= 0) {
        this.relogioRangido = 7 + Math.random() * 9
        this.ruido({ duracao: 1.2, volume: 0.05, freq: 300 + Math.random() * 300, freqFinal: 200 + Math.random() * 600, tipoFiltro: 'bandpass', q: 18, reverb: 0.6 })
      }
      this.relogioPiano -= dt
      if (this.relogioPiano <= 0) {
        this.relogioPiano = 5 + Math.random() * 7
        const notas = ['E4', 'A4', 'C5', 'D5', 'E5']
        this.caixinha(notas[Math.floor(Math.random() * notas.length)], 0.035)
      }
    }
    if (this.modo === 'perseguicao') {
      this.relogioPulso -= dt
      if (this.relogioPulso <= 0) {
        this.relogioPulso = 0.42
        this.tom({ freq: 55, tipo: 'sawtooth', duracao: 0.3, volume: 0.12 })
        this.tom({ freq: 116.5, tipo: 'square', duracao: 0.15, volume: 0.03, atraso: 0.21 })
      }
    }
    if (this.intensidadeBatimento > 0.05) {
      this.relogioBatimento -= dt
      if (this.relogioBatimento <= 0) {
        const i = this.intensidadeBatimento
        this.relogioBatimento = 1.25 - i * 0.75
        const vol = 0.08 + i * 0.2
        this.tom({ freq: 60, freqFinal: 40, tipo: 'sine', duracao: 0.14, volume: vol })
        this.tom({ freq: 55, freqFinal: 38, tipo: 'sine', duracao: 0.14, volume: vol * 0.7, atraso: 0.2 })
      }
    }
  }
}
