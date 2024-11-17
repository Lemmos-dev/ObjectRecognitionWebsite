import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ImagePage = () => {
    const { query } = useRouter();
    const router = useRouter();
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

            // if (!response.ok) {
            //     throw new Error(`Failed to fetch image: ${response.statusText}`);
            // }

            const data = await response.json();
            setImage(data.image);  // This should now contain the relative path, e.g., '/media/tagged_images/image1.png'
            setTags(data.tags || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateTags = async (id, updatedTags) => {
        const response = await fetch(`http://127.0.0.1:8000/api/image/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: updatedTags }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Tags updated successfully:', data);
        } else {
            console.error('Error updating tags:', data);
        }
    };

    const deleteImage = async (id) => {

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/image/${id}/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('Image deleted successfully');
                // Redirect to the upload page
                router.push('/upload'); // Assuming `/upload` is the route for the upload page
            } else {
                const errorData = await response.json();
                console.error('Error deleting image:', errorData);
                alert('Failed to delete image');
            }
        } catch (error) {
            console.error('Error during delete request:', error);
            alert('An unexpected error occurred');
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
                    <button onClick={() => updateTags(id, tags)}>Update Tags</button>
                    <button onClick={() => deleteImage(id)}>Delete Image</button>
                </div>
            ) : (
                <p>No image available.</p>
            )}
        </div>
    );
};

export default ImagePage;

