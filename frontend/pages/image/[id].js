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
    const [tagMode, setTagMode] = useState("include");

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
            fetch(`http://127.0.0.1:8000/api/image/${id}/`)
                .then((res) => res.json())
                .then((data) => {
                    setImage(`http://127.0.0.1:8000${data.image}`);
                    setTags(data.tags || []);
                })
                .catch((err) => console.error("Failed to fetch image:", err));
        }
    }, [id]);

    const toggleTagMode = () => {
        setTagMode((prevMode) => (prevMode === "include" ? "exclude" : "include"));
    };

    const handleImageClick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newTag = { x, y, label: tagMode === "include" ? 1 : 0 };
        const updatedTags = [...tags, newTag];

        setTags(updatedTags);

        // Update tags in the database via PUT
        fetch(`http://127.0.0.1:8000/api/image/${id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: updatedTags }),
        }).catch((err) => console.error("Failed to update tags:", err));
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Image Details</h1>
            {image ? (
                <div style={{position: "relative", display: "inline-block"}}>
                    <img
                        src={image}
                        alt="Tagged"
                        onClick={handleImageClick}
                        style={{maxWidth: "100%", cursor: "crosshair"}}
                    />
                    {tags.map((tag, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                top: `${tag.y}px`,
                                left: `${tag.x}px`,
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: tag.label === 1 ? "green" : "red",
                                transform: "translate(-50%, -50%)",
                            }}
                        ></div>
                    ))}
                </div>
            ) : (
                <p>Loading image...</p>
            )}
            <button onClick={toggleTagMode}>
                Toggle Tag Mode: {tagMode === "include" ? "Include (Green)" : "Exclude (Red)"}
            </button>
            <button onClick={deleteImage}>Delete Image</button>
            <h2>Tags (Plaintext)</h2>
            <ul>
                {tags.map((tag, index) => (
                    <li key={index}>
                        ({tag.x}, {tag.y}) - {tag.label === 1 ? "Include" : "Exclude"}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ImagePage;

