import { useState, useEffect } from "react";

export const useHasBrowser = () => {
  // checks whether the code is running on the browser
  const [hasBrowser, setHasBrowser] = useState(false);

  // when the component mounts is sets use has browser to true
  useEffect(() => {
    setHasBrowser(true);
  }, []);

  return hasBrowser;
};
