import $ from 'cash-dom';
import createHoverable from 'widok-hoverable';

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
        this.slider.isAdjusting = false;
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
    this.element.on('click', () => this.slide.goTo(this.slide));
    createHoverable(this.element);
  }
}

export default Slide;
