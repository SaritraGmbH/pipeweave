declare module 'tdigest' {
  export default class TDigest {
    constructor();
    push(value: number | any[]): void;
    percentile(p: number): number;
    toArray(): any[];
  }
}
