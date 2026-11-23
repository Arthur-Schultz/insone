import { Container, Graphics, RenderTexture, Sprite } from 'pixi.js'
import { ALTURA, LARGURA } from '../config.js'
import { R } from '../core/Recursos.js'

export class Iluminacao {
  constructor(renderer, corAmbiente) {
    this.renderer = renderer
    this.textura = RenderTexture.create({ width: LARGURA / 2, height: ALTURA / 2 })
    this.cena = new Container()
    this.cena.scale.set(0.5)
    this.fundo = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0xffffff)
    this.fundo.tint = corAmbiente
    this.cena.addChild(this.fundo)
    this.camada = new Container()
    this.cena.addChild(this.camada)
    this.sprites = []
    this.sprite = new Sprite(this.textura)
    this.sprite.scale.set(2)
    this.sprite.blendMode = 'multiply'
  }

  definirAmbiente(cor) {
    this.fundo.tint = cor
  }

  luz(indice) {
    if (!this.sprites[indice]) {
      const s = new Sprite(R.luz.radial)
      s.blendMode = 'add'
      this.camada.addChild(s)
      this.sprites[indice] = s
    }
    return this.sprites[indice]
  }

  desenhar(cameraX, cameraY, fontes) {
    let i = 0
    for (const f of fontes) {
      const s = this.luz(i++)
      s.visible = true
      s.texture = f.cone ? R.luz.cone : R.luz.radial
      if (f.cone) {
        s.anchor.set(0, 0.5)
        s.width = f.alcance
        s.height = f.alcance * 0.8
        s.scale.x = Math.abs(s.scale.x) * f.direcao
      } else {
        s.anchor.set(0.5)
        s.width = f.raio * 2
        s.height = f.raio * 2
      }
      s.position.set(f.x - cameraX, f.y - cameraY)
      s.tint = f.cor
      s.alpha = f.intensidade
    }
    for (; i < this.sprites.length; i++) this.sprites[i].visible = false
    this.renderer.render({ container: this.cena, target: this.textura, clear: true })
  }
}
