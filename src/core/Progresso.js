const CHAVE = 'insone-progresso'

export function novaPartida() {
  return { tempo: 0, mortes: 0, bilhetes: 0, sombras: 0, temChave: false }
}

export function lerProgresso() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {}
  } catch {
    return {}
  }
}

export function salvarProgresso(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...lerProgresso(), ...dados }))
  } catch {}
}
