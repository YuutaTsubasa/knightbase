export function format(str: string, ...args: any[]): string {
  return str.replace(/{(\d+)}/g, (_, i) => args[i]);
}