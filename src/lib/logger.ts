const PREFIX = '[WebCopilot]';

const mask = (value?: string) => {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
};

export const logger = {
  log: (...args: any[]) => console.log(PREFIX, ...args),
  info: (...args: any[]) => console.info(PREFIX, ...args),
  warn: (...args: any[]) => console.warn(PREFIX, ...args),
  error: (...args: any[]) => console.error(PREFIX, ...args),
  group: (label: string) => console.group(`${PREFIX} ${label}`),
  groupCollapsed: (label: string) => console.groupCollapsed(`${PREFIX} ${label}`),
  groupEnd: () => console.groupEnd(),
  mask,
};
