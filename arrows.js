import $ from 'cash-dom';
import createHoverable from 'widok-hoverable';

function prepareArrows() {
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
      click: event => this.nextSlide(event),
      touchstart: event => event.stopPropagation(),
    }, { passive: true });
    createHoverable(this.arrowNext);
  }
  if (this.arrowPrev.length > 0) {
    this.arrowPrev.on({
      click: event => this.prevSlide(event),
      touchstart: event => event.stopPropagation(),
    }, { passive: true });
    createHoverable(this.arrowPrev);
  }

  $(window).on('keydown', event => {
    if (!this.options.useKeys) return;
    if (!this.isClosest) return;
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

function handleArrows() {
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

export { prepareArrows, handleArrows };
