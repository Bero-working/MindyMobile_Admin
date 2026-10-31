/**
 * @fileoverview HTTP client class that provides a wrapper around Axios for making HTTP requests
 * Supports multiple instances with shared interceptors for microservices architecture
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { appConfig } from '@/config/app';
import { requireApiUrl } from '@/config/env';
import NetInfo from '@react-native-community/netinfo';
import { NETWORK_ERROR } from '@/assets/constants/network.constant';

export const CONTENT_TYPE = {
  formUrlEncoded: 'application/x-www-form-urlencoded',
  applicationJson: 'application/json',
};
/**
 * Extended request configuration interface that modifies Axios's default config
 * to better suit our application's needs
 */
type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

interface ExtendedRequestConfig extends Omit<AxiosRequestConfig, 'headers'> {
  headers?: Record<string, string>;
  params?: QueryParams;
}

/**
 * Base HTTP client class that provides standardized methods for making HTTP requests
 * across different microservices while sharing global interceptors
 */
export class Http {
  protected readonly axiosInstance: AxiosInstance;
  private static globalAxios = axios;
  /**
   * Creates a new HTTP client instance with specific base URL and shared interceptors
   * @param baseURL - The base URL for all requests made through this instance
   */
  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      ...(baseURL ? { baseURL } : {}),
      timeout: appConfig.api.timeout,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * Sets up request and response interceptors for the axios instance
   */
  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(async (config) => {
      requireApiUrl();
      const network = await NetInfo.fetch();
      if (network.isConnected === false) {
        throw new Error(NETWORK_ERROR.noInternet);
      }
      return config;
    });
  }

  /**
   * Static getter to access the global axios instance
   * Used by interceptors and global configuration
   */
  static get axios() {
    return Http.globalAxios;
  }

  /**
   * Creates a standardized config object for regular HTTP requests
   * @param config - Extended request configuration
   * @param withCredentials - Whether to include credentials in the request
   * @param contentType - Content type header value
   * @returns Configured AxiosRequestConfig object
   */
  private createConfig(
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        'Content-Type': contentType,
        ...(config?.headers || {}),
      },
      params: config?.params || {},
      paramsSerializer: {
        serialize: (params: QueryParams) => {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, String(item)));
            } else {
              searchParams.append(key, String(value));
            }
          });
          return searchParams.toString();
        },
      },
      withCredentials,
    };
  }

  /**
   * Creates a specialized config object for FormData requests
   * @param config - Extended request configuration
   * @param withCredentials - Whether to include credentials in the request
   * @returns Configured AxiosRequestConfig object
   */
  private createFormDataConfig(
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true
  ): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        ...(config?.headers || {}),
      },
      params: config?.params || {},
      withCredentials,
    };
  }

  /**
   * HTTP request methods for making API calls
   * All methods handle response data extraction and proper configuration
   *
   * @template T - Type of the response data
   * @template D - Type of the request payload (for POST, PUT, PATCH methods)
   *
   * @param endpoint - API endpoint path
   * @param data - Request payload (for POST, PUT, PATCH methods)
   * @param config - Extended request configuration object
   * @param withCredentials - Whether to include credentials in request (defaults to true)
   * @param contentType - Content-Type header value (defaults to application/json)
   *
   * @returns Promise<T> - Resolves to response data of type T
   *
   * @remarks
   * - Automatically handles FormData vs JSON payloads
   * - Requires explicit API configuration; authentication is implemented in a later phase
   * - All methods return unwrapped response data
   */
  async get<T>(
    endpoint: string,
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(
      endpoint,
      this.createConfig(config, withCredentials, contentType)
    );
    return response.data;
  }

  async post<T, D>(
    endpoint: string,
    data: D,
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): Promise<T> {
    const isFormData = data instanceof FormData;
    const finalConfig = isFormData
      ? this.createFormDataConfig(config, withCredentials)
      : this.createConfig(config, withCredentials, contentType);

    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      data,
      finalConfig
    );
    return response.data;
  }

  async put<T, D>(
    endpoint: string,
    data: D,
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): Promise<T> {
    const isFormData = data instanceof FormData;
    const finalConfig = isFormData
      ? this.createFormDataConfig(config, withCredentials)
      : this.createConfig(config, withCredentials, contentType);

    const response: AxiosResponse<T> = await this.axiosInstance.put(
      endpoint,
      data,
      finalConfig
    );
    return response.data;
  }

  async patch<T, D>(
    endpoint: string,
    data: D,
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): Promise<T> {
    const isFormData = data instanceof FormData;
    const finalConfig = isFormData
      ? this.createFormDataConfig(config, withCredentials)
      : this.createConfig(config, withCredentials, contentType);

    const response: AxiosResponse<T> = await this.axiosInstance.patch(
      endpoint,
      data,
      finalConfig
    );
    return response.data;
  }

  async delete<T, D = never>(
    endpoint: string,
    data?: D,
    config: ExtendedRequestConfig = {},
    withCredentials: boolean = true,
    contentType: string = CONTENT_TYPE.applicationJson
  ): Promise<T> {
    const finalConfig = {
      ...this.createConfig(config, withCredentials, contentType),
      data,
    };

    const response: AxiosResponse<T> = await this.axiosInstance.delete(
      endpoint,
      finalConfig
    );
    return response.data;
  }
}
