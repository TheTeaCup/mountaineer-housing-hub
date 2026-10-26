import type { Property } from "@/types/properties";
import { fetchProperties } from "@/utils/api/properties";
import { useEffect, useState } from "react";
const emptyProperties: Property[] = [];

export function useProperties(query = "", limit = 100, shuffle = false) {
  const key = `${shuffle}:${limit}:${query}`;
  const [result, setResult] = useState<{
    key: string;
    data: Property[];
    error: string;
  }>({ key: "", data: [], error: "" });
  const [revision, setRevision] = useState(0);
  const requestKey = `${key}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(query, limit, controller.signal, shuffle)
      .then((data) => {
        // Pick once per load so typing and other renders keep the same pictures.
        if (shuffle) {
          data = data.map((property) => {
            const index = Math.floor(Math.random() * property.photos.length);
            return {
              ...property,
              photos: [
                ...property.photos.slice(index),
                ...property.photos.slice(0, index),
              ],
            };
          });
        }
        if (!controller.signal.aborted)
          setResult({ key: requestKey, data, error: "" });
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, data: [], error: err.message });
      });
    return () => controller.abort();
  }, [query, limit, shuffle, requestKey]);
  return {
    properties: result.key === requestKey ? result.data : emptyProperties,
    loading: result.key !== requestKey,
    error: result.key === requestKey ? result.error : "",
    retry: () => setRevision((value) => value + 1),
  };
}
