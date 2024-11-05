import { useState, useRef, useEffect } from 'react';

export default function UploadPage() {
   const [image, setImage] = useState(null);
   const [tags, setTags] = useState([]);
   const canvasRef = useRef(null);

   // Handle image selection and load it onto the canvas
   const handleImageChange = (e) => {
       const file = e.target.files[0];
       setImage(file);
   };

   useEffect(() => {
       if (image && canvasRef.current) {
           const canvas = canvasRef.current;
           const ctx = canvas.getContext('2d');
           const img = new Image();

           // Convert image file to data URL
           const reader = new FileReader();
           reader.onload = (event) => {
               img.src = event.target.result;
           };
           reader.readAsDataURL(image);

           // Draw image when it has loaded
           img.onload = () => {
               // Clear canvas before drawing
               ctx.clearRect(0, 0, canvas.width, canvas.height);

               // Adjust canvas size to match the image's dimensions
               canvas.width = img.width;
               canvas.height = img.height;

               // Draw the image onto the canvas
               ctx.drawImage(img, 0, 0);

               // Draw existing tags if any
               tags.forEach(({ x, y, label }) => {
                   drawTag(ctx, x, y, label);
               });
           };
       }
   }, [image, tags]);

   const handleCanvasClick = (e) => {
       const canvas = canvasRef.current;
       const rect = canvas.getBoundingClientRect();
       const x = e.clientX - rect.left;
       const y = e.clientY - rect.top;

       const newTag = { x, y, label: 'include' };
       setTags([...tags, newTag]);
   };

   const handleUpload = async () => {
       const formData = new FormData();
       formData.append('image', image);
       formData.append('tags', JSON.stringify(tags));

       const response = await fetch('http://localhost:8000/api/upload/', {
           method: 'POST',
           body: formData,
       });

       if (response.ok) {
           alert("Image uploaded successfully!");
           setImage(null);
           setTags([]);
       } else {
           alert("Upload failed.");
       }
   };

   const drawTag = (ctx, x, y, label) => {
       ctx.fillStyle = label === 'include' ? 'green' : 'red';
       ctx.beginPath();
       ctx.arc(x, y, 5, 0, 2 * Math.PI);
       ctx.fill();
   };

   return (
       <div>
           <h1>Upload and Tag Image</h1>
           <input type="file" onChange={handleImageChange} accept="image/*" />
           <div>
               {image && (
                   <canvas
                       ref={canvasRef}
                       onClick={handleCanvasClick}
                       style={{ border: "1px solid black" }}
                   ></canvas>
               )}
           </div>
           <button onClick={handleUpload}>Upload Image and Tags</button>
       </div>
   );
}
