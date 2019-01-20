const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/gm;

export const isValidTime = (time: string): boolean => {
  if (typeof time === 'undefined' || time === null) return false;

  const splitedTime = time.split(':');

  if (splitedTime.length !== 2) return false;

  const hours = parseInt(splitedTime[0], 10);
  const minutes = parseInt(splitedTime[1], 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

  if (hours > 23 || hours < 0) return false;

  return !(minutes > 59 || minutes < 0);
};

export const isValidURL = (url: string): boolean => {
  const isURL = urlRegex.test(url);

  if (!isURL) return false;

  return url.includes('https://meduza.io/');
};
