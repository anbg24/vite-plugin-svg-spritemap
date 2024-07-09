import { readFile } from 'node:fs'
import { promisify } from 'node:util'
import path from 'node:path'
import svgToMiniDataURI from 'mini-svg-data-uri'
import type { Options, SvgDataUriMapObject, SvgMapObject } from '../types'

export class Styles {
  private _svgs: Map<string, SvgDataUriMapObject>
  private _options: Options

  constructor(svgs: Map<string, SvgMapObject>, options: Options) {
    this._svgs = new Map()
    this._options = options

    svgs.forEach((svg, name) => {
      const svgDataUri = svgToMiniDataURI(svg.source)

      this._svgs.set(name, {
        width: svg.width,
        height: svg.height,
        viewbox: svg.viewBox,
        svgDataUri,
      })
    })
  }

  protected createSpriteMap(
    generator: (
      name: string,
      svg: SvgDataUriMapObject,
      isLast: boolean
    ) => string,
  ): string {
    let spriteMap = ''
    let index = 1
    this._svgs.forEach((svg, name) => {
      spriteMap += `${generator(name, svg, index === this._svgs.size)}\n`
      index++
    })
    return spriteMap
  }

  private async insert(insert: string): Promise<string> {
    if (!this._options.styles)
      return ''
    let template
      = this._options.styles.lang === 'css'
        ? ''
        : await promisify(readFile)(
          path.join(__dirname, `/template.${this._options.styles.lang}`),
          'utf8',
        )

    template = template.replace('%route%', this._options.route)

    const doNotEditThisFile = '/* Generated by vite-plugin-svg-spritemap */\n\n'

    return `${doNotEditThisFile + insert}\n${template}`
  }

  // SCSS generation
  private _generate_scss() {
    let insert = `$sprites-prefix: '${this._options.prefix}';\n`

    insert += '$sprites: (\n'
    insert += this.createSpriteMap((name, svg, isLast) => {
      let sprites = ''
      sprites = `\t'${name}': (`
      sprites += `\n\t\turi: "${svg.svgDataUri}",`
      sprites += `\n\t\twidth: ${svg.width}px,`
      sprites += `\n\t\theight: ${svg.height}px`
      sprites += `\n\t${!isLast ? '),' : ')'}`
      return sprites
    })
    insert += ');\n'

    return insert
  }

  // Styl generation
  private _generate_styl() {
    let insert = `$sprites-prefix = '${this._options.prefix}'\n`

    insert += '$sprites = {\n'
    insert += this.createSpriteMap((name, svg, isLast) => {
      let sprites = ''
      sprites = `\t'${name}': {`
      sprites += `\n\t\turi: "${svg.svgDataUri}",`
      sprites += `\n\t\twidth: ${svg.width}px,`
      sprites += `\n\t\theight: ${svg.height}px`
      sprites += `\n\t${!isLast ? '},' : '}'}`
      return sprites
    })
    insert += '}\n'

    return insert
  }

  // Less generation
  private _generate_less() {
    let insert = `@sprites-prefix: '${this._options.prefix}';\n`

    insert += '@sprites: {\n'
    insert += this.createSpriteMap((name, svg) => {
      let sprites = ''
      sprites = `\t@${name}: {`
      sprites += `\n\t\turi: "${svg.svgDataUri}";`
      sprites += `\n\t\twidth: ${svg.width}px;`
      sprites += `\n\t\theight: ${svg.height}px;`
      sprites += '\n\t};'
      return sprites
    })
    insert += '}\n'

    return insert
  }

  // CSS generation
  private _generate_css() {
    let insert = this.createSpriteMap((name, svg) => {
      const selector = `.${this._options.prefix}${name}`
      let sprites = ''
      sprites = `${selector} {`
      sprites += `\n\tbackground: url("${svg.svgDataUri}") center no-repeat;`
      sprites += '\n}'
      return sprites
    })

    insert += this.createSpriteMap((name, svg) => {
      const selector = `.${this._options.prefix}${name}-mask`
      let sprites = ''
      sprites = `${selector} {`
      sprites += `\n\tmask: url("${svg.svgDataUri}") center no-repeat;`
      sprites += '\n}'
      return sprites
    })

    if (this._options.output && this._options.output.view) {
      insert += this.createSpriteMap((name) => {
        const selector = `.${this._options.prefix}${name}-frag`
        let sprites = ''
        sprites = `${selector} {`
        sprites += `\n\tbackground: url('/${this._options.route}#${
          this._options.prefix + name
        }-view') center no-repeat;`
        sprites += '\n}'
        return sprites
      })
    }

    return insert
  }

  public async generate(): Promise<string> {
    if (!this._options.styles)
      return ''
    let insert: string

    switch (this._options.styles.lang) {
      case 'scss':
        insert = this._generate_scss()
        break
      case 'styl':
        insert = this._generate_styl()
        break
      case 'less':
        insert = this._generate_less()
        break
      case 'css':
      default:
        insert = this._generate_css()
    }

    return await this.insert(insert)
  }
}
