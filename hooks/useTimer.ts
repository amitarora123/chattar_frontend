import { useEffect, useState } from 'react';

export const useTimer = () => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const handler = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(handler);
  }, [secondsLeft]);

  return { secondsLeft, setSecondsLeft };
};
