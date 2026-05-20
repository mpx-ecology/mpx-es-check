declare module 'core-js-compat' {
  interface CoreJsCompatOptions {
    targets?: string | string[] | Record<string, string>
  }
  interface CoreJsCompatResult {
    list: string[]
  }
  function coreJsCompat(opts: CoreJsCompatOptions): CoreJsCompatResult
  export = coreJsCompat
}
