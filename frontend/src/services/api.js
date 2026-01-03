import axios from 'axios';

const API_BASE_URL = '/api'; // Django REST Frameworkのエンドポイントに合わせて変更

/**
 * APIクライアント
 * @module api
 */

/**
 * GETリクエストを送信する
 * @param {string} url - リクエスト先のURL
 * @returns {Promise<any>} - レスポンスデータ
 * @throws {Error} - エラーが発生した場合
 */
export const get = async (url: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${url}`);
    return response.data;
  } catch (error: any) {
    console.error(`GET request to ${url} failed:`, error);
    throw error; // エラーを上位に伝播
  }
};

/**
 * POSTリクエストを送信する
 * @param {string} url - リクエスト先のURL
 * @param {any} data - リクエストボディ
 * @returns {Promise<any>} - レスポンスデータ
 * @throws {Error} - エラーが発生した場合
 */
export const post = async (url: string, data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}${url}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`POST request to ${url} failed:`, error);
    throw error; // エラーを上位に伝播
  }
};

/**
 * PUTリクエストを送信する
 * @param {string} url - リクエスト先のURL
 * @param {any} data - リクエストボディ
 * @returns {Promise<any>} - レスポンスデータ
 * @throws {Error} - エラーが発生した場合
 */
export const put = async (url: string, data: any): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}${url}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`PUT request to ${url} failed:`, error);
    throw error; // エラーを上位に伝播
  }
};

/**
 * DELETEリクエストを送信する
 * @param {string} url - リクエスト先のURL
 * @returns {Promise<void>} - レスポンスデータ
 * @throws {Error} - エラーが発生した場合
 */
export const del = async (url: string): Promise<void> => { // Changed 'delete' to 'del' to avoid keyword conflict
  try {
    await axios.delete(`${API_BASE_URL}${url}`);
  } catch (error: any) {
    console.error(`DELETE request to ${url} failed:`, error);
    throw error; // エラーを上位に伝播
  }
};

export default {
  get,
  post,
  put,
  del,
};