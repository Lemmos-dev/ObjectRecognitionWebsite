import { useState, useEffect } from 'react';

const ImagePage = () => {
    const [image, setImage] = useState(null); // Holds the image object
    const [tags, setTags] = useState([]); // Holds the tags for the image
    const [loading, setLoading] = useState(false); // Loading state
    const [error, setError] = useState(null); // Error state

    const imageId = 1; // ID of the image to fetch; replace as needed
    const baseUrl = `http://127.0.0.1:8000/api/image/${imageId}/`;

    // Fetch the image from the backend
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
            setImage(data.image);
            setTags(data.tags || []); // Default to an empty array if no tags
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update the tags for the image in the database
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
            setTags(data.tags); // Update tags after successful update
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete the image from the database
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

            setImage(null); // Remove image from the state after deletion
            setTags([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle updating tags from user input
    const handleTagUpdate = (newTags) => {
        updateTags(newTags);
    };

    // Fetch the image on component mount
    useEffect(() => {
        fetchImage();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Image Details</h1>
            {image ? (
                <div>
                    <img src={`http://127.0.0.1:8000${image}`} alt="Tagged" width="400" />
                    <h2>Tags</h2>
                    <ul>
                        {tags.map((tag, index) => (
                            <li key={index}>
                                {`x: ${tag.x}, y: ${tag.y}, label: ${tag.label}`}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => handleTagUpdate([{ x: 100, y: 200, label: 1 }])}>
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
