import { useEffect, useState } from 'react';

export default function HelloPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch the hello world message from Django
    fetch('http://localhost:8000/api/hello/')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <div>
      <h1>Hello from Next.js</h1>
      <p>{message}</p>
    </div>
  );
}