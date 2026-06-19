export const log = {
  info: (m: string) => console.log(`[${new Date().toISOString()}] ${m}`),
  error: (m: string) => console.error(`[${new Date().toISOString()}] ${m}`),
};
