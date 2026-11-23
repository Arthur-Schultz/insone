import { Container, Filter, GlProgram, Graphics, RenderTexture, Sprite } from 'pixi.js'
import { ALTURA, LARGURA } from '../config.js'
import { R } from '../core/Recursos.js'

const VERTICE = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}`

const FRAGMENTO = `in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform float uNiveis;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a) + 0.03125;
}

void main(void) {
  vec4 cor = texture(uTexture, vTextureCoord);
  vec2 pixel = floor(vTextureCoord * uInputSize.xy);
  float limite = bayer(pixel);
  vec3 v = cor.rgb * uNiveis;
  vec3 base = floor(v);
  vec3 resto = v - base;
  vec3 q = (base + step(vec3(limite), resto)) / uNiveis;
  finalColor = vec4(q, 1.0);
}`

export class Iluminacao {
  constructor(renderer, corAmbiente) {
    this.renderer = renderer
    this.texturaLuz = RenderTexture.create({ width: LARGURA / 2, height: ALTURA / 2 })
    this.textura = RenderTexture.create({ width: LARGURA / 2, height: ALTURA / 2 })
    this.cena = new Container()
    this.cena.scale.set(0.5)
    this.fundo = new Graphics().rect(0, 0, LARGURA, ALTURA).fill(0xffffff)
    this.fundo.tint = corAmbiente
    this.cena.addChild(this.fundo)
    this.camada = new Container()
    this.cena.addChild(this.camada)
    this.sprites = []
    this.pontilhado = new Sprite(this.texturaLuz)
    try {
      this.pontilhado.filters = [
        new Filter({
          glProgram: new GlProgram({ vertex: VERTICE, fragment: FRAGMENTO, name: 'luz-pontilhada' }),
          resources: { uniformesLuz: { uNiveis: { value: 7, type: 'f32' } } }
        })
      ]
    } catch {
      this.pontilhado.filters = []
    }
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
    this.renderer.render({ container: this.cena, target: this.texturaLuz, clear: true })
    this.renderer.render({ container: this.pontilhado, target: this.textura, clear: true })
  }

  destruir() {
    this.texturaLuz.destroy(true)
    this.textura.destroy(true)
  }
}
