import './../scss/base.scss';
const createSlider = require('./../../../widok-slider');

window.slider = createSlider({
  wrap: '#slider',
  mouseDrag: true,
  touchDrag: true,
  useKeys: true,
  slideOnWheel: true,
});
