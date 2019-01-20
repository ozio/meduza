export type MLanguage = 'ru' | 'en';
export type MAction = 'help' | 'exchange' | 'version' | 'url' | 'index' | 'category' | 'time';

export interface Options {
  language: MLanguage;
  action: MAction;
  payload?: {
    category?: string;
    time?: string;
    url?: string;
  };
  props?: {
    number?: number;
    noColor?: boolean;
    noLogo?: boolean;
  };
}

export interface ExchangeData {
  usd: { current: number; prev: number; state: 'down' | 'up' };
  eur: { current: number; prev: number; state: 'down' | 'up' };
  brent: { current: number; prev: number; state: 'down' | 'up' };
  btc: string;
  intouch: number;
}

export interface DocumentPreview {
  datetime: number;
  title: string;
  url: string;
  version: number;
  layout: 'rich' | 'simple' | 'picture' | 'shapito' | 'video' | 'episode' | 'card' | 'episode' | 'brief' | 'brief_subscription';
  source?: {
    trust?: 0 | 1 | 2 | 3;
  };
  tag?: {
    name: string;
    path?: string;
  };
  subtitle?: string;
  second_title?: string;
  chapters?: {
    count: number;
  };
  subscription?: {
    action: string;
    already_message: string;
    error_message: string;
    iframe_src: string;
    label: string;
    second_title: string;
    show: boolean;
    success_message: string;
    title: string;
    wrong_email_message: string;
  };
  image?: {
    display?: 'default';
    credit?: string;
    caption?: string;
    cc: boolean;
    show: boolean;
    width: number;
    height: number;
    blurred_url?: string;
    elarge_url?: string;
    is1to1: string;
    is1to2: string;
    is1to3: string;
    is1to4: string;
    wh_448_523_url?: string;
    wh_693_247_url?: string;
  } | {
    huge_retina_url: string;
    huge_url: string;
    normal_retina_url: string;
    small_url: string;
    squarelarge_url: string;
  } | {
    credit: string;
    large_url: string;
    small_url: string;
  };
  picture?: {
    display: 'default' | 'full';
    width: number;
    height: number;
    mobile_retina_url: string;
    mobile_url: string;
  };
  video?: {
    cover_url: string;
    duration: number;
    duration_in_words: string;
    width: number;
    height: number;
    id: string;
  };
  audio?: {
    explicit: boolean;
    mp3_duration: number;
    mp3_duration_in_words: string;
    mp3_url: string;
    title: string;
    url: string;
  };
  affiliate?: {
    image_url: string;
    sponsored_url: string;
  };
  footer?: {
    button?: {
      text: string;
    };
    is_external?: boolean;
  }
}
