import Transport from 'winston-transport';

class functionCall extends Transport {
  functionCall: any;

  constructor(opts: any) {
    super(opts);
    this.functionCall = opts.call;
  }

  log(info: any, callback: any) {
    setImmediate(() => {
      this.emit('logged', info);
      this.functionCall(info);
    });

    callback();
  }
}

export default functionCall;
