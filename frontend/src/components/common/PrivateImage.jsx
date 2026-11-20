import { useEffect, useState } from "react";
import api from "../../api/axios";

// Imagen que solo se sirve con sesión (DNI): se pide con el token y se pinta como blob
const PrivateImage = ({ endpoint, alt, className, fallback = null, link = false }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!endpoint) return undefined;

    let objectUrl = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);

    api
      .get(endpoint, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [endpoint]);

  if (!endpoint || failed) return fallback;
  if (!url) return <div className={`${className} animate-pulse bg-[#111]`} />;

  const img = <img src={url} alt={alt} className={className} />;
  return link ? (
    <a href={url} target="_blank" rel="noreferrer">
      {img}
    </a>
  ) : (
    img
  );
};

export default PrivateImage;