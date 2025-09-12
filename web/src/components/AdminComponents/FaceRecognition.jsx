import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const MAX_IMAGES = 10;

const FaceRecognition = ({ open, onClose, userInfo }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [images, setImages] = useState([]);
  const imageCountRef = useRef(0);
  const stopRef = useRef(false);
  const loopRunningRef = useRef(false);

  const instructions = [
    "Stay still",
    "Look to your left",
    "Look to your right",
    "Look up",
    "Look down",
    "Stay still again",
    "Smile slightly",
    "Blink twice",
    "Keep eyes open",
    "Final capture"
  ];
  const [instructionIndex, setInstructionIndex] = useState(0);

  const startCaptureLoop = async () => {
    if (loopRunningRef.current) return;

    loopRunningRef.current = true;
    stopRef.current = false;

    while (!stopRef.current && imageCountRef.current < MAX_IMAGES) {
      await detectFaceLoop();
      await new Promise((res) => setTimeout(res, 1500));
    }

    loopRunningRef.current = false;
  };

  useEffect(() => {
    if (!open) return;

    if (!userInfo || !userInfo.email) {
      console.error("Missing user info. Cannot start face capture.");
      toast.error("Missing user information for face registration.");
      return;
    } 

    setCapturing(true);
    setImageCount(0);
    setProgress(0);
    setImages([]);
    setInstructionIndex(0);
    imageCountRef.current = 0;
    stopRef.current = false;
    startCaptureLoop();

    return () => {
      stopRef.current = true;
    };
  }, [open]);


  const detectFaceLoop = async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    try {
      const res = await axios.post("http://127.0.0.1:5000/detect_face", {
        image: screenshot,
        name: `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim(),
      });

      const { detected, box } = res.data;

      if (detected) {
        drawBox(box);
        await saveImage(screenshot, box);
        setFaceDetected(true);
      } else {
        clearCanvas();
        setFaceDetected(false);
      }
    } catch (err) {
      console.error("Face detection error:", err);
      clearCanvas();
      setFaceDetected(false);
    }
  };

  const drawBox = (box) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const cropFaceFromScreenshot = (base64Image, box) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = box.width;
        canvas.height = box.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          box.x, box.y, box.width, box.height,
          0, 0, box.width, box.height
        );

        const croppedBase64 = canvas.toDataURL("image/jpeg");
        resolve(croppedBase64);
      };
      img.src = base64Image;
    });
  };

  const saveImage = async (image, box) => {
    if (stopRef.current || imageCountRef.current >= MAX_IMAGES || !box) return;

    const croppedFace = await cropFaceFromScreenshot(image, box);

    setImages((prevImages) => {
      const newImages = [...prevImages, croppedFace];
      imageCountRef.current = newImages.length;
      setImageCount(newImages.length);
      setProgress((newImages.length / MAX_IMAGES) * 100);
      setInstructionIndex((prev) => Math.min(prev + 1, instructions.length - 1));

      console.log("Captured image", imageCountRef.current);

      if (newImages.length === MAX_IMAGES) {
        const confirmUpload = window.confirm("Use these images for face registration?");
        if (confirmUpload) {
          stopRef.current = true;
          setIsUploading(true);
          sendToServer(newImages);
        } else {
          console.log("User cancelled, restarting capture");
          restartCapture();
        }
      }
      return newImages;
    });
  };

  const restartCapture = () => {
    stopRef.current = true;

    setTimeout(() => {
      setImageCount(0);
      setProgress(0);
      setInstructionIndex(0);
      setImages([]);
      imageCountRef.current = 0;
      stopRef.current = false;
      startCaptureLoop();
    }, 100);
  };


const sendToServer = async (images) => {
  try {
    if (!userInfo || !userInfo.email) {
      toast.error("User info is missing or incomplete. Cannot register face data.");
      return;
    }

    console.log("User info being sent:", userInfo);

    await axios.post("http://localhost:5000/register-face", {
      images,
      name: `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim(),
      email: userInfo.email,
      uniqueNumber: userInfo.uniqueNumber || userInfo.studentNumber || userInfo.employeeNumber,
      role: (userInfo.role || "").trim().toLowerCase(),
    });

    toast.success(`Face data for ${userInfo.firstName} ${userInfo.lastName} registered successfully!`);
  } catch (err) {
    console.error("Error uploading face data:", err);
    toast.error("Failed to register face data.");
  } finally {
    setIsUploading(false);
    handleClose();
  }
};

  const handleClose = () => {
    stopRef.current = true;
    setCapturing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isUploading ? "Processing..." : "Face Registration"}</DialogTitle>
        </DialogHeader>

        {isUploading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="text-lg font-medium">Uploading face data...</p>
            <p className="text-sm text-muted-foreground">This may take a moment.</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-4 p-4">
            {capturing && (
              <>
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="rounded-xl shadow-md"
                  />
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="absolute top-0 left-0 rounded-xl"
                  />
                </div>
                <div className="w-full mt-2">
                  <Progress value={progress} />
                </div>
                <p className="text-sm text-gray-600">
                  {faceDetected ? (
                    <>
                      Capturing image {imageCount}/{MAX_IMAGES}<br />
                      👉 Instruction: <span className="font-medium text-black">{instructions[instructionIndex]}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 font-medium">No face detected. Please face the camera.</span>
                    </>
                  )}
                </p>
              </>
            )}

            <Button onClick={handleClose} disabled={isUploading} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRecognition;