import './../scss/base.scss';
import createSlider from './../../../widok-slider';

window.slider = createSlider({
  wrap: '#slider',
  mouseDrag: true,
  touchDrag: true,
  useKeys: true,
  slideOnWheel: true,
});
