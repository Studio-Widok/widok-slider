function applyPosition(duration) {
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

export default applyPosition;
