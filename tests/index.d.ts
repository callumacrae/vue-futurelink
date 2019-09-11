declare global {
  namespace jest {
    interface Matchers<R> {
      toEmit(eventName:string|string[], fn:Function): R;
      toLogError(expected:string): R;
    }
  }
}

export {}
