function prepareDrag() {
  if (this.options.touchDrag) {
    this.endDrag = endDrag.bind(this);
    this.onDrag = onDrag.bind(this);

    this.wrap.on('touchstart', event => {
      if (!this.isEnabled) return;
      if (this.options.preventDefaultDrag) event.preventDefault();
      if (this.isSliding) return;
      this.dragStart = {
        x: event.changedTouches[0].pageX,
        y: event.changedTouches[0].pageY,
      };
      onMoveStart.call(this);
      window.addEventListener('touchend', this.endDrag);
      window.addEventListener('touchmove', this.onDrag);
    });
  }
  if (this.options.mouseDrag) {
    this.onMouseMove = onMouseMove.bind(this);
    this.endMouseMove = endMouseMove.bind(this);

    this.wrap.on('mousedown', event => {
      if (!this.isEnabled) return;
      event.preventDefault();
      if (this.isSliding) return;
      this.dragStart = {
        x: event.pageX,
        y: event.pageY,
      };
      onMoveStart.call(this);
      window.addEventListener('mouseup', this.endMouseMove);
      window.addEventListener('mousemove', this.onMouseMove);
    });
  }
}

function onMoveStart() {
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

function onDrag(event) {
  const currentPos = {
    x: event.changedTouches[0].pageX,
    y: event.changedTouches[0].pageY,
  };
  onMove.call(this, currentPos);
}

function onMouseMove(event) {
  const currentPos = {
    x: event.pageX,
    y: event.pageY,
  };
  onMove.call(this, currentPos);
}

function onMove(currentPos) {
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

function endDrag(event) {
  const dragEnd = {
    x: event.changedTouches[0].pageX,
    y: event.changedTouches[0].pageY,
  };
  endMove.call(this, dragEnd);
  window.removeEventListener('touchend', this.endDrag);
  window.removeEventListener('touchmove', this.onDrag);
}

function endMouseMove(event) {
  const dragEnd = {
    x: event.pageX,
    y: event.pageY,
  };
  endMove.call(this, dragEnd);
  window.removeEventListener('mouseup', this.endMouseMove);
  window.removeEventListener('mousemove', this.onMouseMove);
}

function endMove(dragEnd) {
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

export { prepareDrag };
