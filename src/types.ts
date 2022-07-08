import type { OptimizeOptions as SvgoOptimizeOptions } from 'svgo'

export type Pattern = string[] | string

export type StylesLang = 'less' | 'scss' | 'styl' | 'css'
export type StylesFormat = 'auto' | 'data' | 'fragment'

export interface UserOptions {
  svgo?: boolean | SvgoOptimizeOptions
  output?: {
    filename?: string
  }
  prefix?: string
  styles?:
    | {
        format: StylesFormat
      }
    | boolean
}

export interface Options {
  svgo: SvgoOptimizeOptions | false
  output: {
    filename: string
  }
  prefix: string
  styles:
    | {
        format: StylesFormat
      }
    | false
}
