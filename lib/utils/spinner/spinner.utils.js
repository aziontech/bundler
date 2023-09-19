import signale from 'signale';

class Spinner {
  constructor(action) {
    this.action = action;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.intervalId = null;
    this.currentFrameIndex = 0;
  }

  start() {
    signale.pending(`Starting ${this.action}...`);

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.currentFrameIndex];
      process.stdout.write(`\r${frame} Running ${this.action} ...`);
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.frames.length;
    }, 100);
  }

  stop() {
    clearInterval(this.intervalId);
    signale.success(`${this.action} complete!`);
  }

  fail() {
    clearInterval(this.intervalId);
    signale.error(`${this.action} error`);
  }
}

export default Spinner;
