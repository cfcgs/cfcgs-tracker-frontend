// src/utils/paramsSerializer.js
/**
 * Serializa parâmetros para o Axios de forma compatível com o FastAPI (Query).
 * Arrays são serializados como chaves repetidas (ex: year=2020&year=2021).
 */
export const paramsSerializer = (params) => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (Array.isArray(value)) {
      // Adiciona cada item do array como uma chave separada
      value.forEach((item) => {
        searchParams.append(key, item);
      });
    } else if (value !== null && value !== undefined) {
      // Adiciona outros valores
      searchParams.append(key, value);
    }
  }
  return searchParams.toString();
};