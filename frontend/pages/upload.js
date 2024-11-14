import { useState, useRef } from 'react';

export default function UploadPage() {
    const [image, setImage] = useState(null);
    const [tags, setTags] = useState([]);
    const [currentLabel, setCurrentLabel] = useState("include");
    const [resultImage, setResultImage] = useState(null);
    const canvasRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
        };
        reader.readAsDataURL(file);
    };

    const toggleLabel = () => {
        setCurrentLabel(currentLabel === "include" ? "exclude" : "include");
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newTag = { x, y, label: currentLabel };
        setTags([...tags, newTag]);

        // Draw tag dot immediately
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = currentLabel === "include" ? "green" : "red";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2); // 5-pixel radius dot
        ctx.fill();
    };

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('image', image);

        const tagsData = tags.map(tag => ({
            x: tag.x,
            y: tag.y,
            label: tag.label === "include" ? 1 : 0
        }));
        formData.append('tags', JSON.stringify(tagsData));

        const response = await fetch('http://localhost:8000/api/segment/', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setResultImage(imageUrl);
        } else {
            console.error("Failed to get segmentation from SAM2.");
        }
    };

    return (
        <div>
            <h1>Upload and Tag Image for SAM2 Segmentation</h1>
            <input type="file" onChange={handleImageChange} accept="image/*" />
            <button onClick={toggleLabel}>Toggle Tag Mode (Current: {currentLabel})</button>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ border: "1px solid black" }}
                ></canvas>
            </div>
            <button onClick={handleUpload}>Run SAM2 Segmentation</button>

            {resultImage && (
                <div>
                    <h2>Segmentation Result</h2>
                    <img src={resultImage} alt="Segmentation Result" />
                </div>
            )}
        </div>
    );
}
