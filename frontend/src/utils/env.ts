export const getApiUrl = () => {
  console.log("META ENV", import.meta.env);
  console.log("PROCESS ENV", process.env);
  return "https://ilywoklih4.execute-api.us-east-1.amazonaws.com/api";
};
