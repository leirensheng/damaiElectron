Math.easeInOutQuad = (t, b, c, d) => {
  // eslint-disable-next-line no-param-reassign
  t /= d / 2;
  if (t < 1) {
    return (c / 2) * t * t + b;
  }
  // eslint-disable-next-line no-param-reassign
  t -= 1;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

// requestAnimationFrame for Smart Animating http://goo.gl/sx5sts
const requestAnimFrame = window.requestAnimationFrame;

/**
 * Because it's so fucking difficult to detect the scrolling element, just move them all
 * @param {number} amount
 */
function move(amount) {
  document.documentElement.scrollTop = amount;
  document.body.parentNode.scrollTop = amount;
  document.body.scrollTop = amount;
}

function position() {
  return (
    document.documentElement.scrollTop ||
    document.body.parentNode.scrollTop ||
    document.body.scrollTop
  );
}

export default (to, duration, callback) => {
  const start = position();
  const change = to - start;
  const increment = 20;
  let currentTime = 0;
  // eslint-disable-next-line no-param-reassign
  duration = typeof duration === 'undefined' ? 500 : duration;
  const animateScroll = () => {
    // increment the time
    currentTime += increment;
    // find the value with the quadratic in-out easing function
    const val = Math.easeInOutQuad(currentTime, start, change, duration);
    // move the document.body
    move(val);
    // do the animation unless its over
    if (currentTime < duration) {
      requestAnimFrame(animateScroll);
    } else if (callback && typeof callback === 'function') {
      // the animation is done so lets callback
      callback();
    }
  };
  animateScroll();
};
