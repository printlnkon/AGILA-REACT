import { db } from "@/api/firebase";
import { addDoc, collection, doc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddRoomModal({ onRoomAdded }) {
  const [open, setOpen] = useState(false);
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    floor: "",
    roomNo: "",
  });

  // generate room numbers based on selected floor
  useEffect(() => {
    if (formData.floor) {
      const floorPrefix = formData.floor;
      const roomNumbers = Array.from({ length: 10 }, (_, i) => {
        const num = i + 1;
        return `RM ${floorPrefix}${num < 10 ? "0" : ""}${num}`;
      });
      setAvailableRoomNumbers(roomNumbers);

      // auto-select the first room number if none is selected
      if (!formData.roomNo) {
        setFormData((prev) => ({ ...prev, roomNo: roomNumbers[0] }));
      }
    } else {
      setAvailableRoomNumbers([]);
      setFormData((prev) => ({ ...prev, roomNo: "" }));
    }
  }, [formData.floor]);

  // handle select changes
  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // validation for required fields
      if (!formData.floor || !formData.roomNo) {
        toast.error("Please fill all required fields.");
        return;
      }

      // add room to Firestore
      const roomData = {
        roomNo: formData.roomNo,
        floor: formData.floor,
        status: formData.status || "available",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const roomRef = await addDoc(collection(db, "rooms"), roomData);
      
      if (onRoomAdded) {
        onRoomAdded({ id: roomRef.id, ...roomData });
      }
      
      // close the dialog
      setOpen(false);
    
      // reset form after submission
      setFormData({ floor: "", roomNo: "" });
    } catch (error) {
      console.error("Error adding room:", error);
      toast.error("Failed to add room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Room</DialogTitle>
          <DialogDescription>
            Add new room in the system. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            {/* room information */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {/* floor selection */}
              <div className="space-y-1">
                <Label htmlFor="floor">
                  Floor <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.floor}
                  onValueChange={(value) => handleSelectChange("floor", value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((floor) => (
                      <SelectItem key={floor} value={floor.toString()}>
                        {floor === 1
                          ? `${floor}st Floor`
                          : floor === 2
                          ? `${floor}nd Floor`
                          : floor === 3
                          ? `${floor}rd Floor`
                          : `${floor}th Floor`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* room no. - updates based on floor selection */}
              {formData.floor && (
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="roomNo">
                    Room no. <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.roomNo}
                    onValueChange={(value) =>
                      handleSelectChange("roomNo", value)
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select room no." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {availableRoomNumbers.map((roomNo) => (
                        <SelectItem key={roomNo} value={roomNo}>
                          {roomNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="cursor-pointer"
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSubmitting || !formData.floor || !formData.roomNo}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Adding room...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
