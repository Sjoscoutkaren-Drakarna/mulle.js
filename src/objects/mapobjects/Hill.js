'use strict'

var MapObject = {}

MapObject.onEnterInner = function (car) {
  console.log('enter hill, custom object', this)
  // const strength = this.game.mulle.user.Car.getProperty('strength')

  if (this.opt.HillType === '#SmallHill') {
    if (!this.game.mulle.user.Car.criteria.SmallHill) {
      console.log('small hill should stop strength: ')
      this.soundPlay = this.game.mulle.playAudio(this.def.Sounds[0])
      car.speed = 0
      car.stepback(9)

    } else {
      console.log('small hill')

    }
  } else {
    if (!this.game.mulle.user.Car.criteria.BigHill) {
      console.log('big hill')
      this.soundPlay = this.game.mulle.playAudio(this.def.Sounds[1])
      car.speed = 0
      car.stepback(9)

    } else {
      console.log('small hill')

    }
  }
}

export default MapObject
