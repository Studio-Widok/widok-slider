import './../scss/base.scss';

require('widok');
const createSlider = require('./../../../widok-slider');

window.slider = createSlider({
  wrap: '#slider',
  mouseDrag: true,
  useKeys: true,
});
