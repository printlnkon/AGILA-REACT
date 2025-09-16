import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanFace } from "lucide-react";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const TryRecognition = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedFacesCount, setDetectedFacesCount] = useState(0);
  const [recognitionResults, setRecognitionResults] = useState([]);

  const startRecognition = () => {
    setIsCameraOpen(true);
  };

  const stopRecognition = () => {
    setIsCameraOpen(false);
    setDetectedFacesCount(0);
    setRecognitionResults([]);
  };

  useEffect(() => {
    let intervalId;

    if (isCameraOpen) {
      intervalId = setInterval(async () => {
        if (!webcamRef.current) return;

        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;

        try {
          const response = await axios.post(
            "http://localhost:5000/try-recognition",
            { image: screenshot }
          );

          const result = response.data;
          setDetectedFacesCount(result.detected_faces || 0);
          setRecognitionResults(result.results || []);

        } catch (error) {
          console.error("Recognition failed:", error);
          setDetectedFacesCount(0);
          setRecognitionResults([]);
        }
      }, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCameraOpen]);

  useEffect(() => {
    if (!isCameraOpen || !canvasRef.current || !webcamRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through all recognition results to draw each bounding box
    if (recognitionResults.length > 0) {
      recognitionResults.forEach(result => {
        const { box, name, success } = result;

        if (box) {
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;

          const scaledX = box.x * scaleX;
          const scaledY = box.y * scaleY;
          const scaledWidth = box.width * scaleX;
          const scaledHeight = box.height * scaleY;

          const boxColor = success ? "green" : "red";

          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

          // Draw name text
          ctx.fillStyle = boxColor;
          ctx.font = "20px Arial";
          const nameText = name;
          ctx.fillText(nameText, scaledX, scaledY > 20 ? scaledY - 10 : scaledY + 20);
        }
      });
    }
  }, [recognitionResults, isCameraOpen]);

  return (
    <>
      <Button onClick={startRecognition} className="flex items-center gap-2 cursor-pointer">
        <ScanFace className="h-4 w-4" />
        Try Recognition
      </Button>
      <Dialog open={isCameraOpen} onOpenChange={stopRecognition}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Face Recognition</DialogTitle>
            <DialogDescription>
              Look at the camera to be recognized.
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex justify-center">
            {isCameraOpen && (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full max-w-[500px] aspect-video rounded-md"
                />
                <canvas
                  ref={canvasRef}
                  width={videoConstraints.width}
                  height={videoConstraints.height}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] aspect-video"
                />
              </>
            )}
          </div>
          <div className="flex flex-col items-center">
            <p className="text-md font-semibold text-white">
              Detected Faces: {detectedFacesCount}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={stopRecognition}
              variant="ghost"
              className="w-full sm:w-auto cursor-pointer"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TryRecognition;