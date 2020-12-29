import $ from 'cash-dom';
import Slide from './Slide';

function prepareSlides() {
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

export default prepareSlides;
