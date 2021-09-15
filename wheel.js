function prepareWheel() {
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
    }, { passive: true });
  }
}

export { prepareWheel };
