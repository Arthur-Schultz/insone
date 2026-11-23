import { TILE } from '../config.js'

export function sobrepoe(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function tilesDe(corpo, fase, teste) {
  const lista = []
  const x0 = Math.floor(corpo.x / TILE)
  const x1 = Math.floor((corpo.x + corpo.w - 0.001) / TILE)
  const y0 = Math.floor(corpo.y / TILE)
  const y1 = Math.floor((corpo.y + corpo.h - 0.001) / TILE)
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (teste(tx, ty)) lista.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE })
    }
  }
  return lista
}

function moverX(corpo, dx, fase, solidos, r) {
  corpo.x += dx
  const obstaculos = tilesDe(corpo, fase, (tx, ty) => fase.solido(tx, ty))
  for (const s of solidos) if (s !== corpo && sobrepoe(corpo, s)) obstaculos.push(s)
  for (const o of obstaculos) {
    if (!sobrepoe(corpo, o)) continue
    if (dx > 0) corpo.x = o.x - corpo.w
    else corpo.x = o.x + o.w
    r.x = true
    r.bateu = o
  }
}

function moverY(corpo, dy, fase, solidos, r) {
  const baseAnterior = corpo.y + corpo.h
  corpo.y += dy
  const obstaculos = tilesDe(corpo, fase, (tx, ty) => fase.solido(tx, ty))
  for (const s of solidos) if (s !== corpo && sobrepoe(corpo, s)) obstaculos.push(s)
  if (dy > 0 && !corpo.atravessando) {
    for (const p of tilesDe(corpo, fase, (tx, ty) => fase.plataforma(tx, ty))) {
      if (baseAnterior <= p.y + 0.01) obstaculos.push({ x: p.x, y: p.y, w: p.w, h: 1 })
    }
  }
  for (const o of obstaculos) {
    if (!sobrepoe(corpo, o)) continue
    if (dy > 0) {
      corpo.y = o.y - corpo.h
      r.chao = true
      r.piso = o
    } else {
      corpo.y = o.y + o.h
    }
    r.y = true
  }
}

export function mover(corpo, dx, dy, fase, solidos = []) {
  const r = { x: false, y: false, chao: false, bateu: null, piso: null }
  const passosX = Math.max(1, Math.ceil(Math.abs(dx) / 6))
  for (let i = 0; i < passosX && !r.x; i++) moverX(corpo, dx / passosX, fase, solidos, r)
  const passosY = Math.max(1, Math.ceil(Math.abs(dy) / 6))
  for (let i = 0; i < passosY && !r.y; i++) moverY(corpo, dy / passosY, fase, solidos, r)
  return r
}
