import $ from 'cash-dom';
import createScrollItem from 'widok-scroll-item';
import throttle from 'widok-throttle';
import widok from 'widok';

import prepareSlides from './prepareSlides';
import applyPosition from './applyPosition';
import { prepareWheel } from './wheel';
import { handleArrows, prepareArrows } from './arrows';
import { prepareDrag } from './drag';

/**
 * @callback onActivate
 * @param {Slide} activatedSlide
 * @param {Slider} slider
 */
/**
 * @callback onDeactivate
 * @param {Slide} deactivatedSlide
 * @param {Slider} slider
 */

/**
 * @typedef {Object} options
 * main
 * @property {string} wrap selector of the slider wrap
 * @property {string} slideSelector default='.single-slide'
 * @property {boolean} isVertical default=false, direction of the slider
 *  selector of a single slide, searched inside wrap
 * @property {number} initialSlide default=0
 *  id of the initially selected slide
 * @property {boolean} loop default=false
 * @property {boolean} slidesAsLinks default=false
 *  clicking on a slide activates it
 * @property {boolean} adjustHeight default=false
 *  after switching slides the height of the slider is changed
 *
 * animation
 * @property {number} duration default=300
 *  duration of the sliding animation
 * @property {string} animationType default="slide", 'fade' - fade effect
 *
 * bullets
 * @property {boolean} shouldHaveBullets default=true,
 * @property {string} bulletContainer
 *  if undefined bullet container will get created inside options.wrap with
 *  class .slider-bullet-container
 * @property {string} bulletSelector
 *  if undefined bullets will get created with class .slider-bullet
 *
 * controls
 * @property {boolean} mouseDrag default=false
 *  allows slider to be dragged with the mouse
 * @property {boolean} touchDrag default=false
 *  allows slider to be dragged on a touchscreen
 * @property {boolean} preventDefaultDrag default=false
 * @property {boolean} slideOnWheel default=false,
 * @property {boolean} useKeys default=false
 *  changes slides on arrow keys, can be changed later
 * @property {string} arrowPrev
 *  selector of the up arrow, searched in the whole document
 * @property {string} arrowNext analogous
 *
 * callbacks
 * @property {onActivate} onActivate
 *  callback to be called when a slide activates
 * @property {onDeactivate} onDeactivate analogous
 */

let lastId = -1;
class Slider {
  constructor(options) {
    this.id = ++lastId;
    this.wrap = $(options.wrap);
    if (this.wrap.length !== 1) return;

    this.scrollItem = createScrollItem(this.wrap, {
      onScroll: item => {
        this.distanceFromCenter = Math.abs(
          item.offset + item.height / 2 - widok.s - widok.h / 2
        );
      },
    });

    this.prepareOptions(options);
    this.currentSlideId = this.options.initialSlide; // id of the current slide
    this.slideOffset = 0; // number of pixels from current slide beginning
    this.position = 0; // current scroll amount in pixels
    this.barSize = 0; // size of the entire scroll bar
    this.size = 0; // size of the sizer element
    this.isSliding = false; // is slider currently being animated
    this.isDragged = false; // is slider currently being dragged
    this.isEnabled = this.options.isEnabled;
    this.isVertical = this.options.isVertical;

    prepareArrows.call(this);
    prepareSlides.call(this);
    prepareWheel.call(this);
    prepareDrag.call(this);

    this.checkSize = this.checkSize.bind(this);
    window.addEventListener('layoutChange', this.checkSize);

    if (this.options.loop) {
      this.currentSlideId = this.slides.length / 3;
      this.applyPosition();
    }

    this.slides[this.currentSlideId].activate();
  }

  prepareOptions(options) {
    this.options = {
      slideOnWheel: false,
      shouldHaveBullets: true,
      slideSelector: '.single-slide',
      isVertical: false,
      initialSlide: 0,
      duration: 300,
      mouseDrag: false,
      touchDrag: false,
      preventDefaultDrag: false,
      useKeys: false,
      loop: false,
      slidesAsLinks: false,
      adjustHeight: false,
      animationType: 'slide',
      isEnabled: true,
    };
    for (const optionName in options) {
      this.options[optionName] = options[optionName];
    }
  }

  checkSize() {
    if (this.options.isVertical) {
      this.size = this.sizer.height();
    } else {
      this.size = this.sizer.width();
    }
    this.slideOffset = 0;
    this.barSize = 0;
    this.gutter =
      this.slides[0].element.outerWidth(true) -
      this.slides[0].element.outerWidth();

    const sliderOffset = this.isVertical
      ? this.bar.offset().top
      : this.bar.offset().left;
    this.slides.map(slide => {
      const slideSize = slide.checkSize(sliderOffset);
      this.barSize += slideSize;
    });
    this.applyPosition(0);

    if (!this.isVertical) {
      const maxHeight = this.slides.reduce(
        (prev, curr) => Math.max(prev, curr.element[0].scrollHeight),
        0
      );
      if (this.options.adjustHeight) {
        this.wrap.css({
          height: this.slides[this.currentSlideId].element[0].scrollHeight,
        });
      } else {
        this.wrap.css({
          height: maxHeight,
        });
      }
    }
  }

  prevSlide() {
    if (this.currentSlideId <= 0) return;
    if (this.isSliding) return;
    this.currentSlideId--;
    this.slideOffset = 0;
    this.applyPosition();
  }

  nextSlide() {
    if (this.currentSlideId >= this.slides.length - 1) return;
    if (this.isSliding) return;
    this.currentSlideId++;
    this.slideOffset = 0;
    this.applyPosition();
  }
}

Slider.prototype.applyPosition = applyPosition;
Slider.prototype.handleArrows = handleArrows;

/**
 * Create a slider. Vertical slider might not work yet.
 * @param {options} options
 *
 * @returns {Object} Slider object
 */
const sliders = [];
function findClosest() {
  let closestDistance = Infinity;
  let closest;
  for (const slider of sliders) {
    slider.isClosest = false;
    if (slider.distanceFromCenter < closestDistance) {
      closestDistance = slider.distanceFromCenter;
      closest = slider;
    }
  }
  if (closest !== undefined) {
    closest.isClosest = true;
  }
}

window.addEventListener('afterLayoutChange', findClosest);
window.addEventListener('scroll', throttle(100, findClosest));

function createSlider(options) {
  const current = new Slider(options);
  sliders.push(current);
  return current;
}

export default createSlider;
