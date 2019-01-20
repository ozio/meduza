import chalk from 'chalk';
import settings from '../settings';

/* font-style */
export const underline = (s: string): string => chalk.underline(s);
export const italic = (s: string): string => chalk.italic(s);
export const bold = (s: string): string => chalk.bold(s);

/* color */
export const gold = (s: string): string => chalk.hex(settings.colors.primary)(s);
export const gray = (s: string): string => chalk.hex(settings.colors.gray)(s);
export const darkGray = (s: string): string => chalk.hex(settings.colors.darkGray)(s);
