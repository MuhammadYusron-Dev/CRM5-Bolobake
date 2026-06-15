export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  const data = await res.json();
  return data.data; // Since our APIs return { success: true, data: [...] }
};
