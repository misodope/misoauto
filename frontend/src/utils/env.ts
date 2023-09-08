export const getApiUrl = () => {
  console.log("META ENV", import.meta.env);
  console.log("PROCESS ENV", process.env);
  return (
    import.meta.env.VITE_API_URL ||
    "https://ilywoklih4.execute-api.us-east-1.amazonaws.com/api"
  );
};
