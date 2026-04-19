// FaceVerifyModal.jsx
import { useRef, useEffect } from 'react';

export function FaceVerifyModal({ userId, eventId, onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Auto-start camera when modal mounts
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { videoRef.current.srcObject = stream; });
  }, []);

  async function captureAndVerify() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    
    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
    
    const res = await fetch('https://YOUR_API_GATEWAY_URL/verify', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, imageBase64 })
    });
    
    const { verified, confidence } = await res.json();
    onResult(verified, confidence);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Verify it's you</h2>
        <p>Unusual login detected. Please verify your identity.</p>
        <video ref={videoRef} autoPlay width={320} height={240} />
        <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
        <button onClick={captureAndVerify}>Verify Me</button>
      </div>
    </div>
  );
}