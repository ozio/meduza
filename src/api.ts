import axios, { AxiosPromise } from 'axios';
import settings from './settings';
import { DocumentPreview, ExchangeData, Options } from './types';

const baseURL = 'https://meduza.io/api';

export const getIndex = (options: Options): AxiosPromise<{
  collection: string[];
  documents: Record<string, DocumentPreview>
}> => {
  const chrono = options.payload && options.payload.category ? options.payload.category : 'news';
  const page = 0;
  const per_page = options.props && options.props.number ? options.props.number : settings.maximumItemsInList;
  const locale = options.language;

  return axios({
    method: 'get',
    url: `${baseURL}/w4/`,
    data: { chrono, page, per_page, locale },
  });
};

export const getExchanges = (): AxiosPromise<ExchangeData> => {
  return axios({
    method: 'get',
    url: `${baseURL}/misc/stock/all`,
  });
};
