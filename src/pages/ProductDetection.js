import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function ProductDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [shops, setShops] = useState([]);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch shops on component mount
  React.useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await API.get("/shops");
      setShops(res.data);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImage(base64String.split(",")[1]); // Remove data:image/jpeg;base64, prefix
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setUseCamera(true);
    } catch (err) {
      toast.error("Camera access denied");
      console.error("Camera error:", err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      
      const base64String = canvas.toDataURL("image/jpeg");
      setImage(base64String.split(",")[1]);
      setPreview(base64String);
      stopCamera();
    }
  };

  // Submit for detection
  const handleDetect = async () => {
    if (!image) {
      toast.error("Please select or capture an image first");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await API.post("/roboflow/detect", {
        image,
        shop_id: selectedShop || null,
      });

      setResults(res.data);

      if (res.data.low_stock_alerts.length > 0) {
        toast.warning(`${res.data.low_stock_alerts.length} low stock alert(s) generated!`);
      } else {
        toast.success("Detection complete! All stock levels are good.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Detection failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResults(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl mb-6 font-bold text-gray-800">Product Detection</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Image Input */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Capture or Upload Image</h3>

            {/* Shop Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Shop (Optional)</label>
              <select
                className="w-full border rounded p-2"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="">-- Select Shop --</option>
                {shops.map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id}>
                    {shop.shop_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Input Options */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📁 Upload Image
              </button>
              <button
                onClick={useCamera ? stopCamera : startCamera}
                className={`flex-1 px-4 py-2 rounded text-white ${
                  useCamera ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {useCamera ? "📷 Stop Camera" : "📷 Use Camera"}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Camera View */}
            {useCamera && (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded border"
                />
                <button
                  onClick={capturePhoto}
                  className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  📸 Capture Photo
                </button>
              </div>
            )}

            {/* Image Preview */}
            {preview && !useCamera && (
              <div className="mb-4">
                <img src={preview} alt="Preview" className="w-full rounded border" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDetect}
                disabled={!image || loading}
                className={`flex-1 px-4 py-3 rounded font-semibold text-white ${
                  !image || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "🔄 Detecting..." : "🔍 Detect Products"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Detection Results</h3>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {!loading && !results && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg">No results yet</p>
                <p className="text-sm">Upload or capture an image to begin detection</p>
              </div>
            )}

            {!loading && results && (
              <div>
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <p className="text-lg font-semibold">
                    Total Items: <span className="text-blue-600">{results.total_items}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Unique Products: {Object.keys(results.product_counts).length}
                  </p>
                </div>

                {/* Product Counts */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Product Counts:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(results.product_counts).map(([product, count]) => (
                      <div
                        key={product}
                        className={`p-3 rounded flex justify-between items-center ${
                          count < 5 ? "bg-red-50 border border-red-200" : "bg-gray-50"
                        }`}
                      >
                        <span className="font-medium capitalize">{product.replace(/_/g, " ")}</span>
                        <span
                          className={`font-bold ${
                            count < 5 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Alerts */}
                {results.low_stock_alerts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h4 className="font-semibold text-red-800 mb-2">
                      ⚠️ Low Stock Alerts ({results.low_stock_alerts.length})
                    </h4>
                    <div className="space-y-2">
                      {results.low_stock_alerts.map((alert, idx) => (
                        <div key={idx} className="text-sm text-red-700">
                          <strong>{alert.product_name}:</strong> {alert.detected_count} items
                          (threshold: {alert.threshold})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.low_stock_alerts.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <p className="text-green-700 font-semibold">✅ All stock levels are adequate!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}