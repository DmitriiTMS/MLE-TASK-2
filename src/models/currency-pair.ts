export class CurrencyPair {
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {}

  static parse(input: string): CurrencyPair | null {
    const parts = input.trim().toUpperCase().split('-');
    if (parts.length !== 2) {
      return null;
    }
    
    const [from, to] = parts;
    if (!from || !to || from.length !== 3 || to.length !== 3) {
      return null;
    }
    
    return new CurrencyPair(from, to);
  }

  toString(): string {
    return `${this.from}-${this.to}`;
  }
}