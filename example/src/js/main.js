import './../scss/base.scss';

require('widok');
const createSlider = require('./../../../widok-slider');
const test = require('./../../../test');

window.slider = createSlider({
  wrap: '#slider',
  mouseDrag: true,
  touchDrag: true,
  useKeys: true,
  slideOnWheel: true,
});
