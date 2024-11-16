import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ImagePage = () => {
    const { query } = useRouter();
    const { id } = query; // `id` will be dynamically retrieved from the URL
    const [image, setImage] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const baseUrl = `http://127.0.0.1:8000/api/image/${id}/`; // Dynamic URL based on `id`

    const fetchImage = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(baseUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const data = await response.json();
            setImage(data.image);  // This should now contain the relative path, e.g., '/media/tagged_images/image1.png'
            setTags(data.tags || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateTags = async (updatedTags) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(baseUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: updatedTags }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update tags: ${response.statusText}`);
            }

            const data = await response.json();
            setTags(data.tags);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteImage = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(baseUrl, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete image: ${response.statusText}`);
            }

            setImage(null);
            setTags([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchImage();
        }
    }, [id]); // Re-fetch image when the `id` changes

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Image Details</h1>
            {image ? (
                <div>
                    <img
                        src={`http://127.0.0.1:8000${image}`}  // Full image URL (prepend base URL)
                        alt="Tagged"
                        width="400"
                    />
                    <h2>Tags</h2>
                    <ul>
                        {tags.map((tag, index) => (
                            <li key={index}>
                                {`x: ${tag.x}, y: ${tag.y}, label: ${tag.label}`}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => updateTags([{ x: 100, y: 200, label: 1 }])}>
                        Update Tags
                    </button>
                    <button onClick={deleteImage}>Delete Image</button>
                </div>
            ) : (
                <p>No image available.</p>
            )}
        </div>
    );
};

export default ImagePage;

