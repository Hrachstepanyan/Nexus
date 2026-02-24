export const SOURCES = {
  AUTOTRADER: 'AUTOTRADER',
  CARGURUS: 'CARGURUS',
  CARS_COM: 'CARS_COM',
  CARFAX: 'CARFAX',
  FACEBOOK: 'FACEBOOK',
  CRAIGSLIST: 'CRAIGSLIST',
  MOCK: 'MOCK',
} as const;

export type Source = (typeof SOURCES)[keyof typeof SOURCES];
