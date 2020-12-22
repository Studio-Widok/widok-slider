const $ = require('cash-dom');
const createHoverable = require('widok-hoverable');
require('widok');

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

class Slider {
  constructor(options) {
    this.id = ++Slider.lastId;
    this.wrap = $(options.wrap);
    if (this.wrap.length !== 1) return;

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

    this.prepareArrows();
    this.prepareSlides();
    this.prepareWheel();
    this.prepareDrag();

    this.checkSize = this.checkSize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.endMouseMove = this.endMouseMove.bind(this);
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

  prepareSlides() {
    this.sizer = $('<div class="slider-sizer">')
      .css({
        position: 'relative',
        height: '100%',
      })
      .appendTo(this.wrap);
    this.bar = $('<div class="slider-bar">').appendTo(this.sizer);
    this.slides = [];

    if (this.options.shouldHaveBullets) {
      if (
        this.options.bulletContainer === undefined &&
        this.options.bulletSelector === undefined
      ) {
        this.bulletContainer = $(document.createElement('div'))
          .addClass('slider-bullet-container')
          .appendTo(this.wrap)
          .on('touchstart', event => {
            if (!this.isEnabled) return;
            event.stopPropagation();
          });
      } else {
        this.bulletContainer = $(this.options.bulletContainer);
      }
    }

    const foundSlides = this.wrap.find(this.options.slideSelector);
    if (this.options.loop) {
      foundSlides.clone().map((index, element) => {
        let slide = new Slide(element, this);
        slide.element.appendTo(this.bar);
        this.slides.push(slide);
      });
      foundSlides.clone().map((index, element) => {
        let slide = new Slide(element, this);
        slide.element.appendTo(this.bar);
        this.slides.push(slide);
      });
    }
    foundSlides.map((index, element) => {
      let slide = new Slide(element, this);
      slide.element.appendTo(this.bar);
      this.slides.push(slide);
    });

    this.slides.forEach(slide => slide.createBullet());

    this.wrap.css({
      position: 'relative',
      overflow: 'hidden',
    });
    this.bar.css({
      position: 'absolute',
      height: 100 + '%',
      width: 100 + '%',
      left: 0,
    });

    const weightSum = this.slides.reduce((prev, curr) => prev + curr.weight, 0);
    if (this.options.isVertical) {
      this.bar.css({
        height: weightSum * 100 + '%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      });
      this.slides.map(slide =>
        slide.element.css({
          height: (100 * slide.weight) / weightSum + '%',
        })
      );
    } else {
      this.bar.css({
        width: weightSum * 100 + '%',
        display: 'flex',
        alignItems: 'flex-start',
      });
      this.slides.map(slide =>
        slide.element.css({
          width: (100 * slide.weight) / weightSum + '%',
        })
      );
    }
  }

  prepareArrows() {
    this.isArrowPrevActive = true;
    this.isArrowNextActive = true;
    this.arrowPrev = $(this.options.arrowPrev);
    this.arrowNext = $(this.options.arrowNext);
    if (this.options.arrowNext === undefined) {
      this.arrowNext = this.wrap.find('.arrow-next');
    }
    if (this.options.arrowPrev === undefined) {
      this.arrowPrev = this.wrap.find('.arrow-prev');
    }

    if (this.arrowNext.length > 0) {
      this.arrowNext.on({
        click: this.nextSlide.bind(this),
        touchstart: event => event.stopPropagation(),
      });
      createHoverable(this.arrowNext);
    }
    if (this.arrowPrev.length > 0) {
      this.arrowPrev.on({
        click: this.prevSlide.bind(this),
        touchstart: event => event.stopPropagation(),
      });
      createHoverable(this.arrowPrev);
    }
    $(window).on('keydown', event => {
      if (!this.options.useKeys) return;
      if (
        (!this.options.isVertical && event.which === 39) ||
        (this.options.isVertical && event.which === 40)
      ) {
        this.nextSlide();
      } else if (
        (!this.options.isVertical && event.which === 37) ||
        (this.options.isVertical && event.which === 38)
      ) {
        this.prevSlide();
      }
    });
  }

  prepareWheel() {
    if (this.options.slideOnWheel) {
      this.wrap.on('wheel', event => {
        if (!this.isEnabled) return;

        event.stopPropagation();
        event.preventDefault();
        if (this.isSliding) return;

        if (event.deltaY > 0) {
          const slideBottom = this.slides[this.currentSlideId].size;
          const wrapBottom = this.size - this.slideOffset;
          if (slideBottom <= wrapBottom + 1) {
            this.nextSlide();
          } else {
            this.slideOffset = Math.max(
              this.slideOffset - 150,
              -this.slides[this.currentSlideId].size + this.size
            );
            this.applyPosition();
          }
        } else if (event.deltaY < 0) {
          if (0 <= this.slideOffset + 1) {
            this.prevSlide();
          } else {
            this.slideOffset = Math.min(this.slideOffset + 150, 0);
            this.applyPosition();
          }
        }
      });
    }
  }

  prepareDrag() {
    if (this.options.touchDrag) {
      this.endDrag = this.endDrag.bind(this);
      this.onDrag = this.onDrag.bind(this);
      this.wrap.on('touchstart', event => {
        if (!this.isEnabled) return;
        if (this.options.preventDefaultDrag) event.preventDefault();
        if (this.isSliding) return;
        this.dragStart = {
          x: event.changedTouches[0].pageX,
          y: event.changedTouches[0].pageY,
        };
        this.onMoveStart();
        window.addEventListener('touchend', this.endDrag);
        window.addEventListener('touchmove', this.onDrag);
      });
    }
    if (this.options.mouseDrag) {
      this.wrap.on('mousedown', event => {
        if (!this.isEnabled) return;
        event.preventDefault();
        if (this.isSliding) return;
        this.dragStart = {
          x: event.pageX,
          y: event.pageY,
        };
        this.onMoveStart();
        window.addEventListener('mouseup', this.endMouseMove);
        window.addEventListener('mousemove', this.onMouseMove);
      });
    }
  }

  onMoveStart() {
    this.isDragged = true;
    this.lastDrag = {
      lastSaveId: 0,
      values: [
        {
          x: this.dragStart.x,
          y: this.dragStart.y,
        },
      ],
    };
  }

  onDrag(event) {
    const currentPos = {
      x: event.changedTouches[0].pageX,
      y: event.changedTouches[0].pageY,
    };
    this.onMove(currentPos);
  }

  onMouseMove(event) {
    const currentPos = {
      x: event.pageX,
      y: event.pageY,
    };
    this.onMove(currentPos);
  }

  onMove(currentPos) {
    this.lastDrag.lastSaveId = (this.lastDrag.lastSaveId + 1) % 10;
    this.lastDrag.values[this.lastDrag.lastSaveId] = currentPos;
    const axis = this.options.isVertical ? 'y' : 'x';
    const diff = currentPos[axis] - this.dragStart[axis];
    this.position =
      this.slides[this.currentSlideId].offset - diff - this.slideOffset / 2;

    if (this.options.isVertical) {
      this.bar.css({
        top: -this.position,
      });
    } else {
      this.bar.css({
        left: -this.position,
      });
    }
  }

  endDrag(event) {
    const dragEnd = {
      x: event.changedTouches[0].pageX,
      y: event.changedTouches[0].pageY,
    };
    this.endMove(dragEnd);
    window.removeEventListener('touchend', this.endDrag);
    window.removeEventListener('touchmove', this.onDrag);
  }

  endMouseMove(event) {
    const dragEnd = {
      x: event.pageX,
      y: event.pageY,
    };
    this.endMove(dragEnd);
    window.removeEventListener('mouseup', this.endMouseMove);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  endMove(dragEnd) {
    const partNeededToSlide = 1 / 100;
    this.isDragged = false;
    const axis = this.options.isVertical ? 'y' : 'x';

    let currentPos = this.slides[this.currentSlideId].offset;
    currentPos -= dragEnd[axis] - this.dragStart[axis];

    const applyFoundSlide = found => {
      this.currentSlideId = found;
      this.slideOffset = 0;
    };

    // previous position
    if (dragEnd[axis] > this.dragStart[axis]) {
      let found = 0;
      for (let i = 0; i < this.slides.length; i++) {
        const slideCenter = this.slides[i].offset + this.slides[i].size / 2;
        const wrapStart = currentPos - this.slideOffset / 2;
        if (slideCenter > wrapStart) {
          found = i;
          break;
        }
      }

      const isSlidedEnoughToChange = () => {
        const slidedAmount = dragEnd[axis] - this.dragStart[axis];
        const amountNedeedToSlide =
          this.slides[this.currentSlideId].size * partNeededToSlide;
        return slidedAmount > amountNedeedToSlide;
      };

      if (this.currentSlideId === found) {
        if (isSlidedEnoughToChange() && found > 0) applyFoundSlide(found - 1);
      } else applyFoundSlide(found);
    }

    // next position
    else if (dragEnd[axis] < this.dragStart[axis]) {
      let found = this.slides.length - 1;
      for (let i = 0; i < this.slides.length; i++) {
        const slideCenter = this.slides[i].offset + this.slides[i].size / 2;
        const wrapEnd = currentPos - this.slideOffset / 2 + this.size;
        if (slideCenter > wrapEnd) {
          found = Math.max(i - 1, 0);
          break;
        }
      }

      const isSlidedEnoughToChange = () => {
        const slidedAmount = this.dragStart[axis] - dragEnd[axis];
        const amountNedeedToSlide =
          this.slides[this.currentSlideId].size * partNeededToSlide;
        return slidedAmount > amountNedeedToSlide;
      };

      if (this.currentSlideId === found) {
        if (isSlidedEnoughToChange() && found + 1 < this.slides.length)
          applyFoundSlide(found + 1);
      } else applyFoundSlide(found);
    }

    this.applyPosition();
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

  applyPosition(duration) {
    const adjustPosition = () => {
      if (this.options.loop) {
        const trueLength = this.slides.length / 3;
        let isAdjusted = false;
        if (this.currentSlideId < trueLength) {
          this.currentSlideId += trueLength;
          isAdjusted = true;
        } else if (this.currentSlideId >= 2 * trueLength) {
          this.currentSlideId -= trueLength;
          isAdjusted = true;
        }
        if (isAdjusted) {
          this.wrap.addClass('adjusting');
          this.applyPosition(0);
          setTimeout(() => {
            this.wrap.removeClass('adjusting');
          }, 100);
        }
      }
    };
    this.isSliding = true;
    if (duration === undefined) {
      duration = this.options.duration;
    }
    const currentSlide = this.slides[this.currentSlideId];
    this.position = currentSlide.offset - this.slideOffset / 2;
    if (this.position > this.barSize - this.size) {
      this.position = this.barSize - this.size;
      this.slideOffset -= (this.position - this.barSize - this.size) / 2;
    }

    this.slides.forEach((slide, index) => {
      if (index < this.currentSlideId) slide.markAsPrev();
      else if (index > this.currentSlideId) slide.markAsNext();
      else slide.activate();
    });
    this.handleArrows();

    let css;
    if (this.options.animationType === 'fade') {
      css = {
        transition: `opacity ${duration / 2 / 1000}s`,
        opacity: 0,
      };
    } else {
      css = {
        transition: `${duration / 1000}s`,
      };
    }

    this.bar.css(css);
    if (this.options.isVertical) {
      css.top = -this.position;
    } else {
      css.left = -this.position;
    }

    if (this.options.animationType === 'fade') {
      setTimeout(() => {
        this.bar.css(css);
        this.bar.css({
          opacity: 1,
        });
        this.isSliding = false;

        // adjust the position if slider needs to loop
        adjustPosition();
      }, duration / 2);
    } else {
      this.bar.css(css);
      setTimeout(() => {
        this.bar.css({
          transition: 'none',
        });
        this.isSliding = false;

        // adjust the position if slider needs to loop
        adjustPosition();
      }, duration);
    }
    setTimeout(() => {
      if (this.options.adjustHeight) {
        this.wrap.css({
          height: this.slides[this.currentSlideId].element[0].scrollHeight,
        });
      }
    }, duration);
  }

  handleArrows() {
    if (this.currentSlideId === this.slides.length - 1) {
      if (this.isArrowNextActive) {
        this.arrowNext.addClass('disabled');
        this.isArrowNextActive = false;
      }
    } else if (!this.isArrowNextActive) {
      this.arrowNext.removeClass('disabled');
      this.isArrowNextActive = true;
    }

    if (this.currentSlideId === 0) {
      if (this.isArrowPrevActive) {
        this.arrowPrev.addClass('disabled');
        this.isArrowPrevActive = false;
      }
    } else if (!this.isArrowPrevActive) {
      this.arrowPrev.removeClass('disabled');
      this.isArrowPrevActive = true;
    }
  }
}
Slider.lastId = -1;

class Slide {
  constructor(element, slider) {
    this.element = $(element);
    if (this.element.length !== 1) return;

    this.content = $('<div class="single-slide-content">')
      .append(this.element.children())
      .appendTo(this.element);

    this.slider = slider;
    this.weight = this.element.data('weight');
    if (this.weight === undefined) this.weight = 1;
    this.id = this.slider.slides.length;
    this.realId = this.id;
    this.directionToActive = undefined;
    this.size = 0;
    this.offset = 0;

    if (this.slider.options.slidesAsLinks) {
      this.element.on('click', () => {
        if (this.directionToActive === 0) return;
        if (this.slider.isSliding) return;
        this.goTo();
      });
    }
  }

  createBullet() {
    if (this.slider.bulletContainer) {
      if (this.slider.options.loop) {
        if (this.id >= (2 * this.slider.slides.length) / 3) {
          this.realId -= (this.slider.slides.length / 3) * 2;
        } else if (this.id >= this.slider.slides.length / 3) {
          this.realId -= this.slider.slides.length / 3;
        }
      }
      if (
        !this.slider.options.loop ||
        (this.id >= this.slider.slides.length / 3 &&
          this.id < (2 * this.slider.slides.length) / 3)
      ) {
        this.bullet = new Bullet(this.slider, this);
      } else {
        this.bulletLink = {
          isLink: true,
          target: this.slider.slides[
            this.realId + this.slider.slides.length / 3
          ],
        };
      }
    }
  }

  checkSize(sliderOffset) {
    if (this.slider.isVertical) {
      this.offset = this.element.offset().top - sliderOffset;
      this.size = this.element.outerHeight(true);
    } else {
      this.offset = this.element.offset().left - sliderOffset;
      this.size = this.element.outerWidth(true);
    }

    return this.size;
  }

  goTo() {
    this.slider.currentSlideId = this.id;
    this.slider.applyPosition();
  }

  activate() {
    if (this.directionToActive !== 0) {
      if (this.bullet !== undefined) this.bullet.element.addClass('active');
      else if (this.bulletLink !== undefined) {
        this.bulletLink.target.bullet.element.addClass('active');
      }
      this.element.addClass('active').removeClass('slide-prev slide-next');
      this.directionToActive = 0;
      if (this.slider.options.onActivate !== undefined) {
        this.slider.options.onActivate.call(this, this, this.slider);
      }
    }
  }

  deactivate() {
    if (this.directionToActive === 0 || this.directionToActive === undefined) {
      this.bullet && this.bullet.element.removeClass('active');
      this.element.removeClass('active');
      if (this.slider.options.onDeactivate !== undefined) {
        this.slider.options.onDeactivate.call(this, this, this.slider);
      }
    }
  }

  markAsPrev() {
    this.deactivate();
    if (this.directionToActive >= 0 || this.directionToActive === undefined) {
      this.element.removeClass('slide-next').addClass('slide-prev');
      this.directionToActive = -1;
    }
  }

  markAsNext() {
    this.deactivate();
    if (this.directionToActive <= 0 || this.directionToActive === undefined) {
      this.element.removeClass('slide-prev').addClass('slide-next');
      this.directionToActive = 1;
    }
  }
}

class Bullet {
  constructor(slider, slide, dummy) {
    this.slider = slider;
    this.slide = slide;
    if (this.slider.options.bulletSelector === undefined) {
      this.element = $(document.createElement('div'))
        .addClass('slider-bullet')
        .appendTo(this.slider.bulletContainer);
    } else {
      this.element = this.slider.bulletContainer
        .find(this.slider.options.bulletSelector)
        .eq(this.slide.realId);
    }
    this.element.on('click', this.slide.goTo.bind(this.slide));
    createHoverable(this.element);
  }
}

/**
 * Create a slider. Vertical slider might not work yet.
 * @param {options} options
 *
 * @returns {Object} Slider object
 */

function createSlider(options) {
  return new Slider(options);
}

export default createSlider;
