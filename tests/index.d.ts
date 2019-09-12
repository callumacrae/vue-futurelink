declare global {
  namespace jest {
    interface Matchers<R> {
      toEmit(eventName:string|string[], fn:Function): R;
      toLog(type:string, expected:string): R;
    }
  }
}

export {}
