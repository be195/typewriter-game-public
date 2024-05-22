export default class IntroStage extends window.DefaultStage {
  init () {
    this.Game.Loader.add('intro', 'Cutscene')
    this.Game.Loader.loaded.intro.start()
    this.Game.Loader.loaded.intro.addEventListener(
      'stop',
      () => this.Game.switchStage('GameplayStage')
    )
  }

  render (time) {}
}
