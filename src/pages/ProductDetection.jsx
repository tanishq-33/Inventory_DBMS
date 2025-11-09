import React, { useState, useRef, useEffect } from "react";
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
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    fetchShops();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchShops = async () => {
    try {
      const res = await API.get("/shops");
      setShops(res.data);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImage(base64String.split(",")[1]);
        setPreview(base64String);
        
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
      });
      setStream(mediaStream);
      setUseCamera(true);
      
      // Wait a moment for state to update, then set video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }, 100);
      
      toast.info("📸 Camera ready! Click capture when ready");
    } catch (err) {
      toast.error("Camera access denied");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      
      const base64String = canvas.toDataURL("image/jpeg", 0.95);
      setImage(base64String.split(",")[1]);
      setPreview(base64String);
      setImageSize({ width: canvas.width, height: canvas.height });
      stopCamera();
      toast.success("✅ Photo captured!");
    }
  };

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
        toast.warning(`⚠️ ${res.data.low_stock_alerts.length} low stock alert(s) generated!`, {
          autoClose: 5000,
        });
      } else {
        toast.success("✅ Detection complete! All stock levels are good.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.details || "Detection failed";
      toast.error(msg);
      console.error("Detection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResults(null);
    setImageSize({ width: 0, height: 0 });
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Draw bounding boxes on the image
  const drawBoundingBoxes = () => {
    if (!results || !results.predictions || !imageRef.current) return null;

    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;
    const scaleX = displayedWidth / imageSize.width;
    const scaleY = displayedHeight / imageSize.height;

    // Color palette for different classes
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];

    return results.predictions.map((pred, idx) => {
      const x1 = (pred.x - pred.width / 2) * scaleX;
      const y1 = (pred.y - pred.height / 2) * scaleY;
      const boxWidth = pred.width * scaleX;
      const boxHeight = pred.height * scaleY;

      const color = colors[pred.class_id % colors.length];

      return (
        <g key={idx}>
          {/* Bounding box */}
          <rect
            x={x1}
            y={y1}
            width={boxWidth}
            height={boxHeight}
            fill="none"
            stroke={color}
            strokeWidth="3"
            className="animate-pulse"
          />
          
          {/* Label background */}
          <rect
            x={x1}
            y={Math.max(y1 - 28, 0)}
            width={Math.min(boxWidth, 150)}
            height="28"
            fill={color}
            opacity="0.9"
            rx="4"
          />
          
          {/* Label text */}
          <text
            x={x1 + 6}
            y={Math.max(y1 - 8, 20)}
            fill="white"
            fontSize="14"
            fontWeight="600"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {pred.class} {(pred.confidence * 100).toFixed(0)}%
          </text>
        </g>
      );
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <span className="text-5xl">🔍</span>
              AI Product Detection
            </h1>
            <p className="text-gray-600 text-lg">
              Upload or capture shelf images to automatically detect and count products
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Controls */}
            <div className="lg:col-span-2 space-y-4">
              {/* Shop Selection Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Select Shop (Optional)
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                >
                  <option value="">All Shops</option>
                  {shops.map((shop) => (
                    <option key={shop.shop_id} value={shop.shop_id}>
                      {shop.shop_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Input Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  Capture Image
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image
                  </button>

                  <button
                    onClick={useCamera ? stopCamera : startCamera}
                    className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                      useCamera
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {useCamera ? "Stop Camera" : "Use Camera"}
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
                  <div className="mt-4 space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-4 border-green-400 shadow-lg bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full"
                        style={{ 
                          minHeight: '300px',
                          maxHeight: '500px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                      </div>
                    </div>
                    <button
                      onClick={capturePhoto}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" strokeWidth={2}/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Capture Photo
                    </button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="space-y-3">
                  <button
                    onClick={handleDetect}
                    disabled={!image || loading}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 ${
                      !image || loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Detecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Detect Products
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>

              {/* Stats Card */}
              {results && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    Detection Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white bg-opacity-20 rounded-lg p-3">
                      <span>Total Items:</span>
                      <span className="text-2xl font-bold">{results.total_items}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white bg-opacity-20 rounded-lg p-3">
                      <span>Unique Products:</span>
                      <span className="text-2xl font-bold">{Object.keys(results.product_counts).length}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white bg-opacity-20 rounded-lg p-3">
                      <span>Alerts:</span>
                      <span className={`text-2xl font-bold ${results.low_stock_alerts.length > 0 ? 'text-yellow-300' : ''}`}>
                        {results.low_stock_alerts.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Image with Bounding Boxes */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  {results ? (
                    <>
                      <span className="text-2xl">🎯</span>
                      Detection Results
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      Preview
                    </>
                  )}
                </h3>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-600"></div>
                      <div className="absolute top-0 left-0 w-24 h-24 flex items-center justify-center">
                        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xl font-medium text-gray-600">Analyzing image...</p>
                    <p className="text-sm text-gray-400">This may take a few seconds</p>
                  </div>
                )}

                {!loading && !preview && (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <svg className="w-32 h-32 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xl font-medium mb-2">No image selected</p>
                    <p className="text-sm">Upload or capture an image to begin detection</p>
                  </div>
                )}

                {!loading && preview && (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={preview}
                      alt="Preview"
                      className="w-full rounded-xl shadow-md"
                      onLoad={() => {
                        if (imageRef.current && imageSize.width === 0) {
                          setImageSize({
                            width: imageRef.current.naturalWidth,
                            height: imageRef.current.naturalHeight
                          });
                        }
                      }}
                    />
                    
                    {/* SVG overlay for bounding boxes */}
                    {results && results.predictions && imageSize.width > 0 && (
                      <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-xl"
                        style={{ mixBlendMode: 'normal' }}
                      >
                        {drawBoundingBoxes()}
                      </svg>
                    )}
                  </div>
                )}

                {/* Product Counts Grid */}
                {!loading && results && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      Product Inventory
                    </h4>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                      {Object.entries(results.product_counts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([product, count]) => (
                          <div
                            key={product}
                            className={`p-4 rounded-xl flex justify-between items-center transition-all duration-200 hover:scale-105 ${
                              count < 5
                                ? "bg-red-50 border-2 border-red-200 hover:border-red-300 shadow-sm"
                                : "bg-green-50 border-2 border-green-200 hover:border-green-300 shadow-sm"
                            }`}
                          >
                            <span className="font-medium text-gray-800 capitalize">
                              {product.replace(/_/g, " ")}
                            </span>
                            <span
                              className={`text-xl font-bold ${
                                count < 5 ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Low Stock Alerts */}
                {!loading && results && results.low_stock_alerts.length > 0 && (
                  <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-5 hover:border-red-300 transition-colors">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2 text-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Low Stock Alerts ({results.low_stock_alerts.length})
                    </h4>
                    <div className="space-y-2">
                      {results.low_stock_alerts.map((alert, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">{alert.product_name}</span>
                            <span className="text-red-600 font-semibold">
                              {alert.detected_count}/{alert.threshold} items
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!loading && results && results.low_stock_alerts.length === 0 && (
                  <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center hover:border-green-300 transition-colors">
                    <svg className="w-16 h-16 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-semibold text-lg">All stock levels are adequate!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}