import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ILogger } from '../utils/logger.interface';
import { IHttpClient } from './http-client.interface';


export class HttpClientAxios implements IHttpClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly logger: ILogger,
    baseURL?: string,
    timeout?: number
  ) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        this.logger.error('Request error', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        this.logger.error('Response error', error);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      this.logger.error(`GET request failed for ${url}`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      this.logger.error(`POST request failed for ${url}`, error);
      throw error;
    }
  }
}