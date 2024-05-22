export class Loader extends EventTarget {
  constructor (game) {
    super()
    this.game = game
    this.loaded = {}
    this.queue = []
    this.typesImport = ['Spritesheet', 'Cutscene', 'Audio']

    this.load()
  }

  async load () {
    this.types = {
      Image: class _Image extends Image {
        constructor (_app, src) {
          super()
          this.src = 'assets/images/' + src + '.png'
        }
      }
    }

    for (const imp of this.typesImport) {
      this.types[imp] = (await import('./assettypes/' + imp.toLowerCase() + '.js'))[imp]
    }

    this.dispatchEvent(new Event('ready'))
  }

  add (filename, type) {
    if (!this.types || this.loaded[filename]) return
    if (this.types[type]) { this.loaded[filename] = new this.types[type](this.game, filename) } else throw new TypeError(`Unknown element type "${type}"`)
    this.dispatchEvent(
      new CustomEvent('loaded', {
        detail: {
          filename,
          type
        }
      })
    )
  }

  addMultiple (list) {
    for (const filename in list)
      this.add(filename, list[filename]);
  }
}
